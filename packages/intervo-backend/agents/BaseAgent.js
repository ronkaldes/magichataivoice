class BaseAgent {
  constructor(name, config = {}) {
    this.basePrompt = "You are an AI Voice agent that helps converse with humans.";
    this.name = name;
    this.aiService = config.aiService || "groq";
    this.aiConfig = config.aiConfig || {};
    this.currentAgent = config.currentAgent || null;
    
    // Add workflow-specific properties
    this.type = config.type;
    this.intents = config.settings?.intents || [];
    this.functions = config.settings?.functions || [];
    this.knowledgeBase = config.settings?.knowledgeBase || {};
    // Use topics if available, otherwise fall back to description for legacy support
    this.agentPrompt = config.settings?.selectedTopics?.join(', ') || config.settings?.description || "";
    this.policies = config.settings?.policies || {
      tone: 'friendly',
      language: 'en-US'
    };
    this.responses = config.settings?.responses || {
      default: '',
      variations: []
    };
    this.llm = config.settings?.llm || {
      provider: 'groq',
      model: ''
    };
    this.contactData = config.contactData || null;
    
    // Add business context from kbArtifacts
    this.kbArtifacts = config.kbArtifacts || null;
  }

  async getAIService() {
    switch (this.aiService) {
      default:
        return require('../services/groqAI');
      //to avoid errors
      // case 'groq':
      //   return require('../services/groqAI');
      // case 'openai':
      //   return require('../services/openAI');
      // case 'aiflow':
      //   return require('../services/ai-flow');
      // default:
      //   throw new Error(`Unknown AI service: ${this.aiService}`);
    }
  }

  async callAI(prompt, options = {}) {
    const service = await this.getAIService();
    console.log('Calling AI with prompt:',  service, this.name);
    return service.handleStream(prompt, { ...this.aiConfig, ...options });
  }

  async process(dynamicInput, conversationState = {}) {
    const matchedIntent = this.intents.find(intent => 
      this.matchIntent(dynamicInput, intent, conversationState)
    ) || {
      name: 'default',
      required_entities: []
    };

    const missingEntities = this.checkRequiredEntities(matchedIntent, conversationState);
    console.log('Missing entities:', missingEntities, 'for agent:', this.name);

    // Log missing entities if any
    if (missingEntities.length > 0) {
      const orchestrationManager = require('../services/OrchestrationManager');
      // Try to get logger from global orchestration context if available
      if (global.orchestrationLogger) {
        await global.orchestrationLogger.logEntityMissing(
          missingEntities, 
          matchedIntent.name, 
          this.name
        );
      }
    }

    const processPrompt = this.buildPrompt(dynamicInput, matchedIntent, conversationState, missingEntities);
    const response = await this.callAI(processPrompt);
    
    // Extract KB assessment if present
    let kbRequired = false;
    let backchannel = null;
    let mainResponse = response;
    let kbResponsePromise = null;

    // Log knowledge base eligibility check
    const hasKbSources = !!this.knowledgeBase?.sources;
    const hasSourceIds = this.knowledgeBase?.sources?.length > 0;
    const kbEligible = hasSourceIds;

    if (global.orchestrationLogger) {
      await global.orchestrationLogger.logEntry({
        type: 'kb_eligibility_check',
        agent: this.name,
        knowledgeBase: {
          hasKbSources: hasKbSources,
          sources: this.knowledgeBase?.sources || [],
          hasSourceIds: hasSourceIds,
          kbEligible: kbEligible
        }
      });
    }

    // Check knowledge base if any sources exist
    if (this.knowledgeBase?.sources?.length > 0) {
      const kbMatch = response.match(/<kb_assessment>\s*({[\s\S]*?})\s*<\/kb_assessment>/);
      
      if (global.orchestrationLogger) {
        await global.orchestrationLogger.logEntry({
          type: 'kb_assessment_extraction',
          agent: this.name,
          hasKbAssessmentTag: !!kbMatch,
          rawResponse: response,
          kbAssessmentMatch: kbMatch ? kbMatch[1] : null
        });
      }
      
      if (kbMatch) {
        try {
          const assessment = JSON.parse(kbMatch[1]);
          kbRequired = assessment.requiresKB;
          backchannel = assessment.requiresKB ? assessment.backchannel : null;
          
          // Log KB assessment result
          if (global.orchestrationLogger) {
            await global.orchestrationLogger.logEntry({
              type: 'kb_assessment_result',
              agent: this.name,
              assessment: assessment,
              kbRequired: kbRequired,
              backchannel: backchannel
            });
          }
          
          // Remove the KB assessment from the main response
          mainResponse = response.replace(/<kb_assessment>[\s\S]*?<\/kb_assessment>/, '').trim();

          if (kbRequired) {
            // Use the knowledgebase query service
            const knowledgebaseQueryService = require('../services/knowledgebaseQueryService');
            const formattedHistory = this.formatConversationHistory(conversationState.conversationHistory || []);
            kbResponsePromise = knowledgebaseQueryService.queryKnowledgebase({
              query: dynamicInput,
              agentName: this.name,
              sources: this.knowledgeBase.sources,
              conversationHistory: formattedHistory,
              config: {
                llm_service: this.llm.provider,
                model_name: this.llm.model,
                temperature: this.aiConfig.temperature || 0.7,
                rerank_model: "rerank-lite-1",
                top_k: 3,
                chunk_size: 1000,
                chunk_overlap: 200
              }
            });
            
            if (global.orchestrationLogger) {
              await global.orchestrationLogger.logEntry({
                type: 'kb_query_initiated',
                agent: this.name,
                query: dynamicInput,
                sources: this.knowledgeBase.sources
              });
            }
          }
        } catch (error) {
          console.error('Error parsing KB assessment:', error);
          
          if (global.orchestrationLogger) {
            await global.orchestrationLogger.logError('kb_assessment_parse_error', error, {
              agentName: this.name,
              kbAssessmentText: kbMatch[1]
            });
          }
        }
      }
    }

    const baseResponse = {
      canProcess: true,
      confidence: 0.8,
      text: kbRequired ? backchannel : mainResponse,
      agent: this.name,
      intent: matchedIntent.name,
      priority: kbRequired ? 'immediate' : 'normal',
      order: 1,
      missingEntities,
      agentName: this.name,
      knowledgeBase: this.knowledgeBase // Add KB info for logging
    };

    if (kbRequired) {
      return {
        ...baseResponse,
        kbRequired: true,
        kbResponse: kbResponsePromise
      };
    }

    return baseResponse;
  }

  async matchIntent(input, intent, context) {
    // Basic intent matching - this could be more sophisticated
    return true; // For now, always return true
  }

  buildPrompt(input, intent, conversationState, missingEntities) {
    const agentConfig = {
      type: this.type,
      description: this.agentPrompt,
      policies: this.policies,
      knowledgeBase: this.knowledgeBase
    };

    const formattedHistory = this.formatConversationHistory(conversationState.conversationHistory || []);

    // Format contact data if available
    let contactInfoText = '';
    if (this.contactData) {
      contactInfoText = `
      Contact Information of the person you are talking to:
      - Name: ${this.contactData.fullName || `${this.contactData.firstName || ''} ${this.contactData.lastName || ''}`.trim()}
      - Country Code: ${this.contactData.countryCode || 'N/A'}
      Use this information to personalize the conversation and make it more natural.`;
    }

    // Format business context from kbArtifacts if available
    let businessContextText = '';
    if (this.kbArtifacts?.summary) {
      const summary = this.kbArtifacts.summary;
      businessContextText = `
      Business Context:
      - Company/Service: ${summary.key_topics_entities?.slice(0, 2)?.join(', ') || 'Not specified'}
      - Overall Theme: ${summary.overall_theme || 'Not specified'}
      - Key Topics: ${summary.key_topics_entities?.join(', ') || 'Not specified'}
      - Service Overview: ${summary.content_overview || 'Not specified'}
      
      You are representing this business in all interactions. Use this context to provide accurate and relevant information.`;
    }

    // Add KB assessment to the prompt if agent has any KB sources
    const kbAssessmentText = this.knowledgeBase?.sources?.length > 0 ? `
      FIRST: Assess if knowledge base consultation is needed:
      1. Does this query require consulting the knowledge base for an accurate answer?
      2. How confident are you that this is better answered by the knowledge base? (1 absolute yes, 0 absolute no, in between if unsure)
      3. If yes, provide a natural backchannel response (like "Let me check that for you". do not use this exact phrase, but a variant of it. Please keep it unique.)

      Format your response as follows:
      <kb_assessment>
      {
        "requiresKB": boolean,
        "kBRequiredConfidence": number (0-1),
        "backchannel": string (only if requiresKB is true)
      }
      </kb_assessment>

      THEN: Provide your main response below.
    ` : '';

    // Only mention missing entities if there are any AND they're relevant to the current intent
    const missingEntitiesText = missingEntities.length > 0 && intent.required_entities?.length > 0
      ? `\nIMPORTANT: This intent requires the following information that we haven't collected yet: ${missingEntities.join(', ')}. Only ask for this information if it's directly relevant to answering the user's current question.\n`
      : '';

    return `
      Agent Configuration:
      Name: ${this.name}
      Type: ${agentConfig.type}
      Description: ${agentConfig.description}
      Policies: 
      - Tone: ${agentConfig.policies.tone}
      - Language: ${agentConfig.policies.language}

      Current Intent:
      ${JSON.stringify(intent)}

      Knowledge Base:
      ${JSON.stringify(agentConfig.knowledgeBase)}

      ${businessContextText}

      ${contactInfoText}

      ${missingEntitiesText}

      User Input: "${input}"

      Conversation History:
      ${formattedHistory}

      ${kbAssessmentText}

      Instructions:
      - Respond naturally to the user's current question or request
      - Do NOT mention previously collected information unless it's directly relevant to the current conversation
      - Do NOT say things like "I already have your name" unless the user is specifically asking about their name or trying to provide it again
      - Focus on addressing what the user is asking about right now
      - Be helpful and conversational while staying on topic
      - Use the business context to provide accurate information about the company/service you represent
      - If any required info is missing AND needed for this specific request, ask for it naturally within your response

      Please respond according to the agent's configuration and current intent.
    `;
  }

  formatConversationHistory(history) {
    if (!Array.isArray(history) || history.length === 0) return '';
    
    return history
      .map(entry => {
        const speaker = entry.speaker === 'agent' ? 'Agent' : 'User';
        return `${speaker}: ${entry.text}`;
      })
      .join('\n');
  }

  async shouldProcess(input, context = {}) {
    return true;
  }

  checkRequiredEntities(intent, context) {
    if (!intent.required_entities) return [];
    const collectedEntities = context.entities?.fields || {};
    return intent.required_entities.filter(entity => !collectedEntities.hasOwnProperty(entity));
  }

  buildEntityRequest(entityName) {
    return `Could you tell me your ${entityName}?`;
  }

  async executeFunction(functionName, params) {
    const func = this.functions.find(f => f.name === functionName);
    if (!func) throw new Error(`Function ${functionName} not found`);

    try {
      const response = await fetch(func.api_endpoint, {
        method: func.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      return await response.json();
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
      throw error;
    }
  }
}

module.exports = { BaseAgent }; 