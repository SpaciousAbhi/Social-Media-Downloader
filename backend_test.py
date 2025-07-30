#!/usr/bin/env python3
"""
Telegram Bot Backend Testing Script
Tests the Express server health endpoint and monitors bot stability
"""

import requests
import time
import subprocess
import sys
import json
from datetime import datetime

class TelegramBotTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
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

    def test_express_server_health(self):
        """Test if Express server is responding"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("Status") == "Active":
                    return self.log_test("Express Server Health", True, f"- Status: {data['Status']}")
                else:
                    return self.log_test("Express Server Health", False, f"- Unexpected response: {data}")
            else:
                return self.log_test("Express Server Health", False, f"- HTTP {response.status_code}")
        except Exception as e:
            return self.log_test("Express Server Health", False, f"- Error: {str(e)}")

    def test_supervisor_status(self):
        """Check if telegram-bot service is running in supervisor"""
        try:
            result = subprocess.run(['sudo', 'supervisorctl', 'status', 'telegram-bot'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                status_line = result.stdout.strip()
                if "RUNNING" in status_line:
                    return self.log_test("Supervisor Status", True, f"- {status_line}")
                else:
                    return self.log_test("Supervisor Status", False, f"- {status_line}")
            else:
                return self.log_test("Supervisor Status", False, f"- Command failed: {result.stderr}")
        except Exception as e:
            return self.log_test("Supervisor Status", False, f"- Error: {str(e)}")

    def test_port_binding(self):
        """Check if port 5000 is properly bound"""
        try:
            result = subprocess.run(['netstat', '-tlnp'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                port_5000_lines = [line for line in lines if ':5000' in line and 'LISTEN' in line]
                if port_5000_lines:
                    return self.log_test("Port 5000 Binding", True, f"- {len(port_5000_lines)} listener(s) found")
                else:
                    return self.log_test("Port 5000 Binding", False, "- No listeners on port 5000")
            else:
                return self.log_test("Port 5000 Binding", False, f"- Command failed: {result.stderr}")
        except Exception as e:
            return self.log_test("Port 5000 Binding", False, f"- Error: {str(e)}")

    def check_recent_logs(self):
        """Check recent logs for errors"""
        try:
            # Check stdout logs
            result = subprocess.run(['tail', '-n', '20', '/var/log/supervisor/telegram-bot.out.log'], 
                                  capture_output=True, text=True, timeout=10)
            stdout_logs = result.stdout.strip() if result.returncode == 0 else "No stdout logs"
            
            # Check stderr logs
            result = subprocess.run(['tail', '-n', '20', '/var/log/supervisor/telegram-bot.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            stderr_logs = result.stdout.strip() if result.returncode == 0 else "No stderr logs"
            
            # Look for error patterns
            error_patterns = ['409', 'conflict', 'error', 'Error', 'ERROR', 'exception', 'Exception']
            
            stdout_errors = any(pattern in stdout_logs.lower() for pattern in [p.lower() for p in error_patterns])
            stderr_errors = any(pattern in stderr_logs.lower() for pattern in [p.lower() for p in error_patterns])
            
            if not stdout_errors and not stderr_errors:
                return self.log_test("Recent Logs Check", True, "- No error patterns found in recent logs")
            else:
                error_msg = ""
                if stdout_errors:
                    error_msg += f"Stdout errors found. "
                if stderr_errors:
                    error_msg += f"Stderr errors found. "
                return self.log_test("Recent Logs Check", False, f"- {error_msg}")
                
        except Exception as e:
            return self.log_test("Recent Logs Check", False, f"- Error: {str(e)}")

    def test_env_configuration(self):
        """Check if .env file has required configuration"""
        try:
            with open('/app/.env', 'r') as f:
                env_content = f.read()
            
            has_token = 'TOKEN=' in env_content and len(env_content.split('TOKEN=')[1].split('\n')[0].strip()) > 10
            has_dev_id = 'DEV_ID=' in env_content and env_content.split('DEV_ID=')[1].split('\n')[0].strip().isdigit()
            
            if has_token and has_dev_id:
                return self.log_test("Environment Configuration", True, "- TOKEN and DEV_ID properly configured")
            else:
                missing = []
                if not has_token:
                    missing.append("TOKEN")
                if not has_dev_id:
                    missing.append("DEV_ID")
                return self.log_test("Environment Configuration", False, f"- Missing or invalid: {', '.join(missing)}")
                
        except Exception as e:
            return self.log_test("Environment Configuration", False, f"- Error: {str(e)}")

    def monitor_stability(self, duration_seconds=30):
        """Monitor bot stability for a specified duration"""
        print(f"\n🔍 Monitoring bot stability for {duration_seconds} seconds...")
        
        initial_status = self.get_supervisor_status()
        if not initial_status:
            return self.log_test("Stability Monitor", False, "- Could not get initial status")
        
        start_time = time.time()
        checks = 0
        failures = 0
        
        while time.time() - start_time < duration_seconds:
            time.sleep(5)  # Check every 5 seconds
            checks += 1
            
            # Check supervisor status
            current_status = self.get_supervisor_status()
            if not current_status or "RUNNING" not in current_status:
                failures += 1
                print(f"⚠️  Status check {checks}: Service not running - {current_status}")
            
            # Check Express server
            try:
                response = requests.get(f"{self.base_url}/", timeout=5)
                if response.status_code != 200:
                    failures += 1
                    print(f"⚠️  Health check {checks}: HTTP {response.status_code}")
            except:
                failures += 1
                print(f"⚠️  Health check {checks}: Server unreachable")
        
        success_rate = ((checks - failures) / checks) * 100 if checks > 0 else 0
        
        if failures == 0:
            return self.log_test("Stability Monitor", True, f"- {checks} checks passed, 100% uptime")
        else:
            return self.log_test("Stability Monitor", False, f"- {failures}/{checks} checks failed, {success_rate:.1f}% uptime")

    def get_supervisor_status(self):
        """Get current supervisor status"""
        try:
            result = subprocess.run(['sudo', 'supervisorctl', 'status', 'telegram-bot'], 
                                  capture_output=True, text=True, timeout=5)
            return result.stdout.strip() if result.returncode == 0 else None
        except:
            return None

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Telegram Bot Backend Tests")
        print("=" * 50)
        
        # Basic functionality tests
        self.test_express_server_health()
        self.test_supervisor_status()
        self.test_port_binding()
        self.test_env_configuration()
        self.check_recent_logs()
        
        # Stability monitoring
        self.monitor_stability(30)
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"Test Duration: {(datetime.now() - self.start_time).total_seconds():.1f} seconds")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed! Bot appears to be running correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed. Please check the issues above.")
            return 1

def main():
    tester = TelegramBotTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())