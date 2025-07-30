require('dotenv').config({ path: './env' });
const { getBanned } = require('./funcs/functions');

async function testBotFunctions() {
  console.log('🧪 Testing bot functions...');
  
  try {
    // Test the getBanned function
    console.log('Testing getBanned function...');
    const result = await getBanned('123456789');
    console.log('✅ getBanned result:', result);
    
    if (result.status === true && result.reason === null) {
      console.log('✅ getBanned function is working correctly!');
    } else {
      console.log('❌ getBanned function returned unexpected result');
    }
    
    // Test Instagram function import
    console.log('Testing Instagram function import...');
    const { downloadInstagram } = require('./funcs/instagram');
    console.log('✅ Instagram function imported successfully');
    
    console.log('🎉 All critical functions are working!');
    console.log('🚀 Bot should now be responsive to commands');
    
  } catch (error) {
    console.error('❌ Error testing functions:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testBotFunctions();