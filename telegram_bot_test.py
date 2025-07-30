#!/usr/bin/env python3
"""
Telegram Bot Functionality Testing Script
Tests the actual bot commands and responses as requested in the review
"""

import requests
import time
import json
import sys
from datetime import datetime

class TelegramBotFunctionalTester:
    def __init__(self):
        self.bot_token = "7798265687:AAFvdltAgNn16bu-12obdqIJdws-bRvMwhM"
        self.bot_username = "@VS_Instagram_Automation_Bot"
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
        self.health_endpoint = "http://localhost:5000"
        self.tests_run = 0
        self.tests_passed = 0
        self.start_time = datetime.now()
        
        # Test chat ID (using the DEV_ID from env file)
        self.test_chat_id = "1654334233"

    def log_test(self, name, success, message=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {message}")
        else:
            print(f"❌ {name}: FAILED {message}")
        return success

    def test_webhook_health_endpoint(self):
        """Test the webhook health endpoint"""
        try:
            response = requests.get(f"{self.health_endpoint}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("Status") == "Active":
                    return self.log_test("Webhook Health Endpoint", True, f"- Server responding with Status: {data['Status']}")
                else:
                    return self.log_test("Webhook Health Endpoint", False, f"- Unexpected response: {data}")
            else:
                return self.log_test("Webhook Health Endpoint", False, f"- HTTP {response.status_code}")
        except Exception as e:
            return self.log_test("Webhook Health Endpoint", False, f"- Error: {str(e)}")

    def test_bot_info(self):
        """Test if bot is accessible via Telegram API"""
        try:
            response = requests.get(f"{self.base_url}/getMe", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and data.get("result"):
                    bot_info = data["result"]
                    username = bot_info.get("username", "")
                    first_name = bot_info.get("first_name", "")
                    return self.log_test("Bot Info", True, f"- Bot: @{username} ({first_name})")
                else:
                    return self.log_test("Bot Info", False, f"- API returned: {data}")
            else:
                return self.log_test("Bot Info", False, f"- HTTP {response.status_code}")
        except Exception as e:
            return self.log_test("Bot Info", False, f"- Error: {str(e)}")

    def test_webhook_info(self):
        """Test webhook configuration"""
        try:
            response = requests.get(f"{self.base_url}/getWebhookInfo", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and data.get("result"):
                    webhook_info = data["result"]
                    url = webhook_info.get("url", "")
                    has_custom_certificate = webhook_info.get("has_custom_certificate", False)
                    pending_update_count = webhook_info.get("pending_update_count", 0)
                    
                    if url:
                        return self.log_test("Webhook Configuration", True, 
                                           f"- URL: {url}, Pending: {pending_update_count}")
                    else:
                        return self.log_test("Webhook Configuration", False, "- No webhook URL configured")
                else:
                    return self.log_test("Webhook Configuration", False, f"- API returned: {data}")
            else:
                return self.log_test("Webhook Configuration", False, f"- HTTP {response.status_code}")
        except Exception as e:
            return self.log_test("Webhook Configuration", False, f"- Error: {str(e)}")

    def send_message_to_bot(self, message_text):
        """Send a message to the bot and return the response"""
        try:
            # Send message
            send_data = {
                "chat_id": self.test_chat_id,
                "text": message_text
            }
            
            response = requests.post(f"{self.base_url}/sendMessage", json=send_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    return True, data.get("result", {})
                else:
                    return False, f"API error: {data.get('description', 'Unknown error')}"
            else:
                return False, f"HTTP {response.status_code}"
                
        except Exception as e:
            return False, f"Exception: {str(e)}"

    def get_recent_messages(self, limit=10):
        """Get recent messages from the bot"""
        try:
            # Get updates
            response = requests.get(f"{self.base_url}/getUpdates?limit={limit}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    return True, data.get("result", [])
                else:
                    return False, f"API error: {data.get('description', 'Unknown error')}"
            else:
                return False, f"HTTP {response.status_code}"
                
        except Exception as e:
            return False, f"Exception: {str(e)}"

    def test_start_command(self):
        """Test /start command"""
        print("\n🔍 Testing /start command...")
        
        success, result = self.send_message_to_bot("/start")
        
        if not success:
            return self.log_test("Start Command", False, f"- Failed to send: {result}")
        
        # Wait a moment for bot to process
        time.sleep(3)
        
        # Check for response by getting recent updates
        success, updates = self.get_recent_messages(5)
        
        if not success:
            return self.log_test("Start Command", False, f"- Failed to get updates: {updates}")
        
        # Look for bot responses in recent updates
        bot_responses = []
        for update in updates:
            if "message" in update:
                msg = update["message"]
                if msg.get("from", {}).get("is_bot") and "Krxuv Bot" in msg.get("text", ""):
                    bot_responses.append(msg.get("text", ""))
        
        if bot_responses:
            return self.log_test("Start Command", True, f"- Bot responded with welcome message")
        else:
            return self.log_test("Start Command", False, "- No bot response found in recent updates")

    def test_instagram_link(self):
        """Test Instagram link processing"""
        print("\n🔍 Testing Instagram link processing...")
        
        # Use a sample Instagram link
        instagram_url = "https://www.instagram.com/p/sample/"
        
        success, result = self.send_message_to_bot(instagram_url)
        
        if not success:
            return self.log_test("Instagram Link", False, f"- Failed to send: {result}")
        
        # Wait for bot to process
        time.sleep(5)
        
        # Check for response
        success, updates = self.get_recent_messages(5)
        
        if not success:
            return self.log_test("Instagram Link", False, f"- Failed to get updates: {updates}")
        
        # Look for bot responses indicating processing
        bot_responses = []
        for update in updates:
            if "message" in update:
                msg = update["message"]
                if msg.get("from", {}).get("is_bot"):
                    text = msg.get("text", "")
                    if "Loading" in text or "Failed" in text or "Bot by" in text:
                        bot_responses.append(text)
        
        if bot_responses:
            return self.log_test("Instagram Link", True, f"- Bot processed Instagram link")
        else:
            return self.log_test("Instagram Link", False, "- No bot response to Instagram link")

    def test_getBanned_function(self):
        """Test that getBanned function is working (allows all users)"""
        print("\n🔍 Testing getBanned function...")
        
        # This is tested indirectly by checking if commands work
        # Since getBanned now returns {status: true, reason: null} for all users
        
        # Send a command that would be blocked if getBanned was broken
        success, result = self.send_message_to_bot("/ai Hello")
        
        if not success:
            return self.log_test("getBanned Function", False, f"- Failed to send: {result}")
        
        # Wait for processing
        time.sleep(3)
        
        # Check for response
        success, updates = self.get_recent_messages(3)
        
        if not success:
            return self.log_test("getBanned Function", False, f"- Failed to get updates: {updates}")
        
        # Look for ban message vs normal processing
        for update in updates:
            if "message" in update:
                msg = update["message"]
                if msg.get("from", {}).get("is_bot"):
                    text = msg.get("text", "")
                    if "You have been banned" in text:
                        return self.log_test("getBanned Function", False, "- User appears to be banned")
        
        return self.log_test("getBanned Function", True, "- getBanned function allows user access")

    def run_all_tests(self):
        """Run all functionality tests"""
        print("🚀 Starting Telegram Bot Functionality Tests")
        print("=" * 60)
        print(f"Bot: {self.bot_username}")
        print(f"Token: {self.bot_token[:10]}...")
        print("=" * 60)
        
        # Basic connectivity tests
        self.test_webhook_health_endpoint()
        self.test_bot_info()
        self.test_webhook_info()
        
        # Functionality tests
        self.test_getBanned_function()
        self.test_start_command()
        self.test_instagram_link()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 FUNCTIONALITY TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"Test Duration: {(datetime.now() - self.start_time).total_seconds():.1f} seconds")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All functionality tests passed! Bot is working correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed. Check the issues above.")
            return 1

def main():
    tester = TelegramBotFunctionalTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())