#!/usr/bin/env python3
"""
Telegram Bot Configuration and Deployment Verification Script
Tests all the specific requirements mentioned in the review request
"""

import os
import requests
import subprocess
import sys
import time
from datetime import datetime

class TelegramBotVerifier:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.start_time = datetime.now()

    def log_test(self, name, success, message=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {message}")
        else:
            print(f"❌ {name}: FAILED {message}")
        return success

    def test_env_file_exists_with_correct_values(self):
        """Test 1: Verify .env file exists with correct TOKEN and DEV_ID"""
        try:
            if not os.path.exists('/app/.env'):
                return self.log_test("Environment File Existence", False, "- .env file not found")
            
            with open('/app/.env', 'r') as f:
                env_content = f.read()
            
            # Check for TOKEN
            expected_token = "7798265687:AAFvdltAgNn16bu-12obdqIJdws-bRvMwhM"
            if f"TOKEN={expected_token}" in env_content:
                token_check = True
            else:
                token_check = False
            
            # Check for DEV_ID
            expected_dev_id = "1654334233"
            if f"DEV_ID={expected_dev_id}" in env_content:
                dev_id_check = True
            else:
                dev_id_check = False
            
            if token_check and dev_id_check:
                return self.log_test("Environment Variables", True, f"- TOKEN and DEV_ID correctly set")
            else:
                missing = []
                if not token_check:
                    missing.append("TOKEN")
                if not dev_id_check:
                    missing.append("DEV_ID")
                return self.log_test("Environment Variables", False, f"- Incorrect values for: {', '.join(missing)}")
                
        except Exception as e:
            return self.log_test("Environment Variables", False, f"- Error: {str(e)}")

    def test_health_check_validates_token(self):
        """Test 2: Test that health-check.js can validate the bot token successfully"""
        try:
            # Run health check with timeout to avoid hanging
            result = subprocess.run(['timeout', '15', 'node', 'health-check.js'], 
                                  cwd='/app', capture_output=True, text=True)
            
            output = result.stdout + result.stderr
            
            # Check for successful token validation
            if "✅ Bot token is valid!" in output:
                if "Instagram Automation Bot" in output and "VS_Instagram_Automation_Bot" in output:
                    return self.log_test("Health Check Token Validation", True, "- Bot token validated successfully")
                else:
                    return self.log_test("Health Check Token Validation", False, "- Token valid but bot info incorrect")
            else:
                return self.log_test("Health Check Token Validation", False, f"- Token validation failed: {output[:200]}")
                
        except Exception as e:
            return self.log_test("Health Check Token Validation", False, f"- Error: {str(e)}")

    def test_dynamic_port_configuration(self):
        """Test 3: Verify index.js uses dynamic PORT configuration"""
        try:
            with open('/app/index.js', 'r') as f:
                index_content = f.read()
            
            # Check for dynamic port usage
            if "process.env.PORT || 5000" in index_content:
                # Also check that it's not hardcoded to 5000 elsewhere
                lines = index_content.split('\n')
                hardcoded_port_lines = [line for line in lines if 'listen(5000' in line or 'PORT = 5000' in line]
                
                if not hardcoded_port_lines:
                    return self.log_test("Dynamic Port Configuration", True, "- Uses process.env.PORT || 5000")
                else:
                    return self.log_test("Dynamic Port Configuration", False, f"- Found hardcoded port usage: {len(hardcoded_port_lines)} lines")
            else:
                return self.log_test("Dynamic Port Configuration", False, "- Does not use process.env.PORT || 5000")
                
        except Exception as e:
            return self.log_test("Dynamic Port Configuration", False, f"- Error: {str(e)}")

    def test_bot_initialization_without_crashes(self):
        """Test 4: Test that the bot can initialize without immediate crashes"""
        try:
            # Check if bot is currently running via supervisor
            result = subprocess.run(['sudo', 'supervisorctl', 'status', 'telegram-bot'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0 and "RUNNING" in result.stdout:
                # Check how long it's been running
                status_line = result.stdout.strip()
                if "uptime" in status_line:
                    return self.log_test("Bot Initialization", True, f"- Bot running successfully: {status_line}")
                else:
                    return self.log_test("Bot Initialization", True, f"- Bot running: {status_line}")
            else:
                return self.log_test("Bot Initialization", False, f"- Bot not running: {result.stdout}")
                
        except Exception as e:
            return self.log_test("Bot Initialization", False, f"- Error: {str(e)}")

    def test_polling_error_handling(self):
        """Test 5: Check that polling error handling is implemented"""
        try:
            with open('/app/index.js', 'r') as f:
                index_content = f.read()
            
            # Check for 409 conflict handling
            has_409_handling = "409 Conflict" in index_content
            has_retry_logic = "retryCount" in index_content and "maxRetries" in index_content
            has_polling_error_handler = "bot.on('polling_error'" in index_content
            
            if has_409_handling and has_retry_logic and has_polling_error_handler:
                return self.log_test("Polling Error Handling", True, "- 409 conflict handling and retry logic implemented")
            else:
                missing = []
                if not has_409_handling:
                    missing.append("409 conflict detection")
                if not has_retry_logic:
                    missing.append("retry logic")
                if not has_polling_error_handler:
                    missing.append("polling error handler")
                return self.log_test("Polling Error Handling", False, f"- Missing: {', '.join(missing)}")
                
        except Exception as e:
            return self.log_test("Polling Error Handling", False, f"- Error: {str(e)}")

    def test_webhook_mode_availability(self):
        """Test 6: Verify webhook mode is available for production"""
        try:
            with open('/app/index.js', 'r') as f:
                index_content = f.read()
            
            # Check for webhook implementation
            has_webhook_detection = "useWebhook" in index_content
            has_webhook_setup = "setWebHook" in index_content
            has_production_check = "NODE_ENV === 'production'" in index_content or "USE_WEBHOOK === 'true'" in index_content
            has_express_webhook_handler = "app.post" in index_content and "bot.processUpdate" in index_content
            
            if has_webhook_detection and has_webhook_setup and has_production_check and has_express_webhook_handler:
                return self.log_test("Webhook Mode Availability", True, "- Webhook mode fully implemented for production")
            else:
                missing = []
                if not has_webhook_detection:
                    missing.append("webhook detection")
                if not has_webhook_setup:
                    missing.append("webhook setup")
                if not has_production_check:
                    missing.append("production environment check")
                if not has_express_webhook_handler:
                    missing.append("Express webhook handler")
                return self.log_test("Webhook Mode Availability", False, f"- Missing: {', '.join(missing)}")
                
        except Exception as e:
            return self.log_test("Webhook Mode Availability", False, f"- Error: {str(e)}")

    def test_no_bot_token_errors(self):
        """Test 7: Verify no more 'Bot Token not provided' errors"""
        try:
            # Check recent logs for token errors
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/telegram-bot.out.log'], 
                                  capture_output=True, text=True)
            stdout_logs = result.stdout if result.returncode == 0 else ""
            
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/telegram-bot.err.log'], 
                                  capture_output=True, text=True)
            stderr_logs = result.stdout if result.returncode == 0 else ""
            
            all_logs = stdout_logs + stderr_logs
            
            # Check for token errors
            token_errors = [
                "Bot Token not provided",
                "FATAL ERROR: Telegram Bot Token not provided",
                "TOKEN not found"
            ]
            
            found_errors = [error for error in token_errors if error in all_logs]
            
            if not found_errors:
                return self.log_test("No Token Errors", True, "- No bot token errors found in recent logs")
            else:
                return self.log_test("No Token Errors", False, f"- Found token errors: {found_errors}")
                
        except Exception as e:
            return self.log_test("No Token Errors", False, f"- Error: {str(e)}")

    def test_graceful_409_handling(self):
        """Test 8: Verify 409 conflict errors are handled gracefully"""
        try:
            # Check recent logs for 409 handling
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/telegram-bot.err.log'], 
                                  capture_output=True, text=True)
            stderr_logs = result.stdout if result.returncode == 0 else ""
            
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/telegram-bot.out.log'], 
                                  capture_output=True, text=True)
            stdout_logs = result.stdout if result.returncode == 0 else ""
            
            all_logs = stdout_logs + stderr_logs
            
            # Check for 409 errors and graceful handling
            has_409_errors = "409 Conflict" in all_logs
            has_graceful_handling = "Telegram server conflict detected" in all_logs and "retry" in all_logs.lower()
            
            if has_409_errors and has_graceful_handling:
                return self.log_test("Graceful 409 Handling", True, "- 409 conflicts detected and handled gracefully with retries")
            elif has_409_errors and not has_graceful_handling:
                return self.log_test("Graceful 409 Handling", False, "- 409 conflicts found but not handled gracefully")
            else:
                return self.log_test("Graceful 409 Handling", True, "- No 409 conflicts detected (bot running smoothly)")
                
        except Exception as e:
            return self.log_test("Graceful 409 Handling", False, f"- Error: {str(e)}")

    def run_all_verifications(self):
        """Run all verification tests"""
        print("🔍 Telegram Bot Configuration and Deployment Verification")
        print("=" * 60)
        print("Testing all requirements from the review request...")
        print()
        
        # Run all tests
        self.test_env_file_exists_with_correct_values()
        self.test_health_check_validates_token()
        self.test_dynamic_port_configuration()
        self.test_bot_initialization_without_crashes()
        self.test_polling_error_handling()
        self.test_webhook_mode_availability()
        self.test_no_bot_token_errors()
        self.test_graceful_409_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 VERIFICATION SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"Test Duration: {(datetime.now() - self.start_time).total_seconds():.1f} seconds")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All verifications passed! The Telegram bot fixes are working correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} verification(s) failed. Please check the issues above.")
            return 1

def main():
    verifier = TelegramBotVerifier()
    return verifier.run_all_verifications()

if __name__ == "__main__":
    sys.exit(main())