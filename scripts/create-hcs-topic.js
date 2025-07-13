const { Client, AccountId, PrivateKey, TopicCreateTransaction, Hbar, Status } = require("@hashgraph/sdk");
const CryptoJS = require("crypto-js");
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error reading .env.local:', error);
    return {};
  }
}

async function createAIDecisionTopic() {
  try {
    console.log('🚀 Creating HCS topic for AI decision verification...');
    
    // Load environment variables
    const env = loadEnvLocal();
    const accountId = env.HEDERA_ACCOUNT_ID;
    const privateKey = env.HEDERA_PRIVATE_KEY;
    const network = env.HEDERA_NETWORK || 'testnet';
    
    console.log('🔗 Account:', accountId);
    console.log('🌐 Network:', network);
    
    if (!accountId || !privateKey) {
      throw new Error('Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env.local');
    }
    
    // Initialize Hedera client
    const hederaAccountId = AccountId.fromString(accountId);
    const hederaPrivateKey = PrivateKey.fromStringECDSA(privateKey);
    
    const client = network === 'testnet' 
      ? Client.forTestnet() 
      : Client.forMainnet();
    
    client.setOperator(hederaAccountId, hederaPrivateKey);
    client.setDefaultMaxTransactionFee(new Hbar(2));

    // Create HCS topic
    const topicCreateTx = new TopicCreateTransaction()
      .setTopicMemo('AI Decision Verification Trail - Phase 2 MVP')
      .setSubmitKey(hederaPrivateKey.publicKey)
      .setMaxTransactionFee(new Hbar(5));

    console.log('📤 Submitting topic creation transaction...');
    const submitTopicCreateTx = await topicCreateTx.execute(client);
    console.log('⏳ Waiting for consensus...');
    const topicCreateRx = await submitTopicCreateTx.getReceipt(client);

    if (topicCreateRx.status === Status.Success) {
      console.log('✅ HCS Topic created successfully!');
      console.log('📋 Topic ID:', topicCreateRx.topicId.toString());
      console.log('🔗 Transaction ID:', submitTopicCreateTx.transactionId.toString());
      console.log('');
      console.log('📝 Add this to your .env.local file:');
      console.log(`HEDERA_AI_DECISION_TOPIC_ID=${topicCreateRx.topicId.toString()}`);
      console.log('');
      console.log('🔍 View on HashScan:');
      console.log(`https://hashscan.io/testnet/topic/${topicCreateRx.topicId.toString()}`);
    } else {
      console.error('❌ Topic creation failed with status:', topicCreateRx.status);
    }
    
    // Close client
    client.close();
    
  } catch (error) {
    console.error('💥 Script execution error:', error);
  }
}

createAIDecisionTopic();
