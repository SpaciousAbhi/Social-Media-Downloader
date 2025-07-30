#!/usr/bin/env python3
"""
Final Telegram Bot Integration Test
Comprehensive test of all bot functionality and deployment readiness
"""

import requests
import subprocess
import time
import json
from datetime import datetime

class FinalBotTest:
    def __init__(self):
        self.results = {
            "configuration": {},
            "deployment": {},
            "functionality": {},
            "error_handling": {},
            "production_readiness": {}
        }

    def test_configuration(self):
        """Test bot configuration"""
        print("🔧 Testing Bot Configuration...")
        
        # Environment variables
        try:
            with open('/app/.env', 'r') as f:
                env_content = f.read()
            
            self.results["configuration"]["env_file"] = {
                "exists": True,
                "has_token": "TOKEN=7798265687:AAFvdltAgNn16bu-12obdqIJdws-bRvMwhM" in env_content,
                "has_dev_id": "DEV_ID=1654334233" in env_content,
                "status": "✅ PASS"
            }
        except Exception as e:
            self.results["configuration"]["env_file"] = {
                "exists": False,
                "error": str(e),
                "status": "❌ FAIL"
            }

        # Dynamic port configuration
        try:
            with open('/app/index.js', 'r') as f:
                index_content = f.read()
            
            uses_dynamic_port = "process.env.PORT || 5000" in index_content
            no_hardcoded_ports = "listen(5000" not in index_content
            
            self.results["configuration"]["port_config"] = {
                "dynamic_port": uses_dynamic_port,
                "no_hardcoded": no_hardcoded_ports,
                "status": "✅ PASS" if uses_dynamic_port and no_hardcoded_ports else "❌ FAIL"
            }
        except Exception as e:
            self.results["configuration"]["port_config"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

    def test_deployment(self):
        """Test deployment aspects"""
        print("🚀 Testing Deployment...")
        
        # Supervisor status
        try:
            result = subprocess.run(['sudo', 'supervisorctl', 'status', 'telegram-bot'], 
                                  capture_output=True, text=True)
            
            is_running = result.returncode == 0 and "RUNNING" in result.stdout
            
            self.results["deployment"]["supervisor"] = {
                "running": is_running,
                "status_output": result.stdout.strip(),
                "status": "✅ PASS" if is_running else "❌ FAIL"
            }
        except Exception as e:
            self.results["deployment"]["supervisor"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

        # Express server health
        try:
            response = requests.get("http://localhost:5000/", timeout=5)
            server_healthy = response.status_code == 200 and response.json().get("Status") == "Active"
            
            self.results["deployment"]["express_server"] = {
                "responding": response.status_code == 200,
                "status_active": response.json().get("Status") == "Active" if response.status_code == 200 else False,
                "status": "✅ PASS" if server_healthy else "❌ FAIL"
            }
        except Exception as e:
            self.results["deployment"]["express_server"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

    def test_functionality(self):
        """Test bot functionality"""
        print("🤖 Testing Bot Functionality...")
        
        # Bot token validation
        try:
            result = subprocess.run(['timeout', '10', 'node', '-e', '''
                require("dotenv").config();
                const TelegramBot = require("node-telegram-bot-api");
                const bot = new TelegramBot(process.env.TOKEN);
                bot.getMe().then(info => {
                    console.log(JSON.stringify({success: true, bot: info}));
                    process.exit(0);
                }).catch(err => {
                    console.log(JSON.stringify({success: false, error: err.message}));
                    process.exit(1);
                });
            '''], cwd='/app', capture_output=True, text=True)
            
            if result.returncode == 0:
                bot_info = json.loads(result.stdout)
                self.results["functionality"]["token_validation"] = {
                    "valid": bot_info["success"],
                    "bot_info": bot_info.get("bot", {}),
                    "status": "✅ PASS" if bot_info["success"] else "❌ FAIL"
                }
            else:
                self.results["functionality"]["token_validation"] = {
                    "valid": False,
                    "error": result.stderr,
                    "status": "❌ FAIL"
                }
        except Exception as e:
            self.results["functionality"]["token_validation"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

    def test_error_handling(self):
        """Test error handling capabilities"""
        print("⚠️  Testing Error Handling...")
        
        # Check for 409 conflict handling in code
        try:
            with open('/app/index.js', 'r') as f:
                index_content = f.read()
            
            has_409_handling = "409 Conflict" in index_content
            has_retry_logic = "retryCount" in index_content and "maxRetries" in index_content
            has_polling_error_handler = "bot.on('polling_error'" in index_content
            
            self.results["error_handling"]["code_implementation"] = {
                "409_conflict_detection": has_409_handling,
                "retry_logic": has_retry_logic,
                "polling_error_handler": has_polling_error_handler,
                "status": "✅ PASS" if all([has_409_handling, has_retry_logic, has_polling_error_handler]) else "❌ FAIL"
            }
        except Exception as e:
            self.results["error_handling"]["code_implementation"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

        # Check actual error handling in logs
        try:
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/telegram-bot.out.log'], 
                                  capture_output=True, text=True)
            stdout_logs = result.stdout if result.returncode == 0 else ""
            
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/telegram-bot.err.log'], 
                                  capture_output=True, text=True)
            stderr_logs = result.stdout if result.returncode == 0 else ""
            
            has_conflict_messages = "Telegram server conflict detected" in stdout_logs
            has_retry_messages = "retry" in stdout_logs.lower()
            no_fatal_errors = "FATAL ERROR" not in (stdout_logs + stderr_logs)
            
            self.results["error_handling"]["runtime_behavior"] = {
                "graceful_conflict_handling": has_conflict_messages,
                "retry_attempts": has_retry_messages,
                "no_fatal_errors": no_fatal_errors,
                "status": "✅ PASS" if no_fatal_errors else "❌ FAIL"
            }
        except Exception as e:
            self.results["error_handling"]["runtime_behavior"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

    def test_production_readiness(self):
        """Test production deployment readiness"""
        print("🌐 Testing Production Readiness...")
        
        # Webhook support
        try:
            with open('/app/index.js', 'r') as f:
                index_content = f.read()
            
            has_webhook_detection = "useWebhook" in index_content
            has_webhook_setup = "setWebHook" in index_content
            has_production_check = "NODE_ENV === 'production'" in index_content
            has_express_handler = "app.post" in index_content and "bot.processUpdate" in index_content
            
            self.results["production_readiness"]["webhook_support"] = {
                "webhook_detection": has_webhook_detection,
                "webhook_setup": has_webhook_setup,
                "production_environment_check": has_production_check,
                "express_webhook_handler": has_express_handler,
                "status": "✅ PASS" if all([has_webhook_detection, has_webhook_setup, has_production_check, has_express_handler]) else "❌ FAIL"
            }
        except Exception as e:
            self.results["production_readiness"]["webhook_support"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

        # Heroku compatibility
        try:
            # Check for Procfile
            procfile_exists = subprocess.run(['test', '-f', '/app/Procfile'], capture_output=True).returncode == 0
            
            # Check package.json for start script
            with open('/app/package.json', 'r') as f:
                package_json = json.loads(f.read())
            
            has_start_script = "start" in package_json.get("scripts", {})
            
            self.results["production_readiness"]["heroku_compatibility"] = {
                "procfile_exists": procfile_exists,
                "start_script": has_start_script,
                "status": "✅ PASS" if procfile_exists and has_start_script else "❌ FAIL"
            }
        except Exception as e:
            self.results["production_readiness"]["heroku_compatibility"] = {
                "error": str(e),
                "status": "❌ FAIL"
            }

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📋 COMPREHENSIVE TELEGRAM BOT TEST REPORT")
        print("=" * 80)
        
        total_tests = 0
        passed_tests = 0
        
        for category, tests in self.results.items():
            print(f"\n🔍 {category.upper().replace('_', ' ')}")
            print("-" * 40)
            
            for test_name, test_result in tests.items():
                status = test_result.get("status", "❓ UNKNOWN")
                print(f"  {test_name.replace('_', ' ').title()}: {status}")
                
                total_tests += 1
                if status == "✅ PASS":
                    passed_tests += 1
        
        print("\n" + "=" * 80)
        print("📊 SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL TESTS PASSED! The Telegram bot is fully functional and ready for deployment.")
            return True
        else:
            print(f"\n⚠️  {total_tests - passed_tests} test(s) failed. Please review the issues above.")
            return False

    def run_comprehensive_test(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Telegram Bot Test Suite")
        print("=" * 80)
        
        self.test_configuration()
        self.test_deployment()
        self.test_functionality()
        self.test_error_handling()
        self.test_production_readiness()
        
        return self.generate_report()

def main():
    tester = FinalBotTest()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())