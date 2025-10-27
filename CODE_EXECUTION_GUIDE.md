# 💻 Code Execution Features - Your Autopilot Can Code!

Your Workflow Autopilot can now **read, write, and execute code** in Python, JavaScript, and Bash! 🎉

---

## 🎯 What Your Autopilot Can Do

### **1. 📖 Read Code Files** (`file_read`)
Read any file within allowed directories to analyze, process, or learn from code.

### **2. ✍️ Write Code Files** (`file_write`)
Create or modify files - generate code, save results, create configs.

### **3. ⚡ Execute Code** (`execute_code`)
Run Python, JavaScript, or Bash code in a secure sandboxed environment.

---

## 🔒 Security Features

### **Filesystem Access:**
- ✅ **Sandboxed Directories** - Only access to `/tmp/workflow-files` and `/workflow-files`
- ✅ **Path Validation** - Prevents directory traversal attacks
- ✅ **Automatic Directory Creation** - Creates needed directories safely

### **Code Execution:**
- ✅ **Timeouts** - Max 30 seconds execution time (configurable)
- ✅ **Limited Environment** - Restricted environment variables
- ✅ **Process Isolation** - Each execution runs in separate process
- ✅ **Output Capture** - Both stdout and stderr captured

---

## 📋 Tool Specifications

### **1. file_read**

**Purpose:** Read file contents

**Input:**
```json
{
  "path": "/tmp/workflow-files/script.py"
}
```

**Output:**
```json
{
  "success": true,
  "content": "print('Hello World')",
  "size": 20,
  "modified": "2025-10-26T10:30:00.000Z"
}
```

**Error Cases:**
- File not found
- Access denied (outside allowed directories)
- Permission denied

---

### **2. file_write**

**Purpose:** Write or create files

**Input:**
```json
{
  "path": "/tmp/workflow-files/output.txt",
  "content": "Workflow result: Success!"
}
```

**Output:**
```json
{
  "success": true,
  "bytes_written": 25,
  "path": "/tmp/workflow-files/output.txt"
}
```

**Features:**
- Auto-creates parent directories
- Overwrites existing files
- UTF-8 encoding

---

### **3. execute_code**

**Purpose:** Execute code in Python, JavaScript, or Bash

**Input:**
```json
{
  "language": "python",
  "code": "print('Hello from Python!')",
  "timeout": 30000
}
```

**Output:**
```json
{
  "success": true,
  "stdout": "Hello from Python!",
  "stderr": "",
  "exit_code": 0,
  "execution_time": 245
}
```

**Supported Languages:**
- `python` - Python 3
- `javascript` - Node.js
- `bash` - Bash shell

---

## 🎬 Example Workflows

### **Example 1: Analyze Python Code**

**Prompt:** "Read a Python file, count the functions, and save the result"

**Generated Workflow:**
```json
{
  "name": "Analyze Python Code",
  "steps": [
    {
      "id": "read_file",
      "name": "Read Python File",
      "tool": "file_read",
      "input": {
        "path": "/tmp/workflow-files/app.py"
      }
    },
    {
      "id": "count_functions",
      "name": "Count Functions",
      "tool": "execute_code",
      "input": {
        "language": "python",
        "code": "import re\ncontent = '''{{read_file.content}}'''\nmatches = re.findall(r'def \\w+', content)\nprint(f'Functions: {len(matches)}')"
      }
    },
    {
      "id": "save_result",
      "name": "Save Analysis",
      "tool": "file_write",
      "input": {
        "path": "/tmp/workflow-files/analysis.txt",
        "content": "{{count_functions.stdout}}"
      }
    }
  ]
}
```

---

### **Example 2: Generate and Test Code**

**Prompt:** "Generate a JavaScript function, write it to a file, and test it"

**Generated Workflow:**
```json
{
  "name": "Generate and Test Function",
  "steps": [
    {
      "id": "generate_code",
      "name": "Generate Function",
      "tool": "execute_code",
      "input": {
        "language": "javascript",
        "code": "console.log('function add(a, b) { return a + b; }\\nmodule.exports = add;')"
      }
    },
    {
      "id": "write_file",
      "name": "Write to File",
      "tool": "file_write",
      "input": {
        "path": "/tmp/workflow-files/add.js",
        "content": "{{generate_code.stdout}}"
      }
    },
    {
      "id": "test_function",
      "name": "Test Function",
      "tool": "execute_code",
      "input": {
        "language": "javascript",
        "code": "const add = require('/tmp/workflow-files/add.js'); console.log('Test: 2 + 3 =', add(2, 3));"
      }
    }
  ]
}
```

---

### **Example 3: Code Quality Check**

**Prompt:** "Read all Python files in a directory and run pylint on them"

**Generated Workflow:**
```json
{
  "name": "Python Code Quality Check",
  "steps": [
    {
      "id": "list_files",
      "name": "List Python Files",
      "tool": "execute_code",
      "input": {
        "language": "bash",
        "code": "find /tmp/workflow-files -name '*.py' -type f"
      }
    },
    {
      "id": "run_lint",
      "name": "Run Pylint",
      "tool": "execute_code",
      "input": {
        "language": "bash",
        "code": "pylint /tmp/workflow-files/*.py || true"
      }
    },
    {
      "id": "save_report",
      "name": "Save Report",
      "tool": "file_write",
      "input": {
        "path": "/tmp/workflow-files/lint-report.txt",
        "content": "{{run_lint.stdout}}\n{{run_lint.stderr}}"
      }
    },
    {
      "id": "send_notification",
      "name": "Send Slack Alert",
      "tool": "slack_message",
      "input": {
        "channel": "#dev",
        "text": "Code quality check complete. Lint report saved."
      }
    }
  ]
}
```

---

### **Example 4: Data Processing Pipeline**

**Prompt:** "Read a CSV file, process it with Python, and save results"

**Generated Workflow:**
```json
{
  "name": "Data Processing Pipeline",
  "steps": [
    {
      "id": "read_csv",
      "name": "Read CSV File",
      "tool": "file_read",
      "input": {
        "path": "/tmp/workflow-files/data.csv"
      }
    },
    {
      "id": "process_data",
      "name": "Process Data",
      "tool": "execute_code",
      "input": {
        "language": "python",
        "code": "import csv\nimport io\ncontent = '''{{read_csv.content}}'''\nreader = csv.DictReader(io.StringIO(content))\ntotal = sum(float(row['amount']) for row in reader)\nprint(f'Total: ${total:.2f}')"
      }
    },
    {
      "id": "save_results",
      "name": "Save Results",
      "tool": "file_write",
      "input": {
        "path": "/tmp/workflow-files/results.txt",
        "content": "Processing complete:\\n{{process_data.stdout}}"
      }
    },
    {
      "id": "log_database",
      "name": "Log to Database",
      "tool": "database_query",
      "input": {
        "table": "workflow_logs",
        "operation": "insert",
        "data": {
          "message": "Data processing complete: {{process_data.stdout}}",
          "log_level": "info"
        }
      }
    }
  ]
}
```

---

## 🚀 Advanced Use Cases

### **1. Automated Code Generation**
```
"Generate a REST API endpoint based on a database schema, write it to a file, and run tests"
```

### **2. Code Quality Automation**
```
"Run ESLint on all JavaScript files, fix auto-fixable issues, and create a PR summary"
```

### **3. Documentation Generator**
```
"Read all Python files, extract docstrings, generate Markdown docs, and commit to repo"
```

### **4. Security Scanner**
```
"Scan all files for hardcoded secrets, log findings to database, and send Slack alert"
```

### **5. Build Automation**
```
"Read package.json, run npm install, execute tests, build for production, and deploy"
```

### **6. Data Science Pipeline**
```
"Read dataset, run pandas analysis, generate visualizations, and email report"
```

---

## ⚠️ Limitations & Best Practices

### **Filesystem:**
- ✅ **Only use allowed directories**: `/tmp/workflow-files` or `/workflow-files`
- ✅ **File size limits**: Be mindful of large files
- ✅ **No system files**: Cannot access system or app files for security

### **Code Execution:**
- ✅ **30 second timeout**: Keep code execution short
- ✅ **No network in code**: Use `http_request` tool for API calls
- ✅ **Limited packages**: Only standard library + installed packages
- ✅ **No persistent state**: Each execution is isolated

### **Security:**
- ✅ **Validate inputs**: Use conditional branches to validate data
- ✅ **Error handling**: Add retry logic and on_error handlers
- ✅ **Rate limiting**: Don't execute code in tight loops
- ✅ **Sanitize output**: Check outputs before using in other steps

---

## 🧪 Testing Your Code Tools

### **Test 1: File Read/Write**

**Create this workflow manually and execute:**
```json
{
  "name": "Test File Operations",
  "description": "Test reading and writing files",
  "steps": [
    {
      "id": "write_test",
      "name": "Write Test File",
      "tool": "file_write",
      "input": {
        "path": "/tmp/workflow-files/test.txt",
        "content": "Hello from Workflow Autopilot!"
      }
    },
    {
      "id": "read_test",
      "name": "Read Test File",
      "tool": "file_read",
      "input": {
        "path": "/tmp/workflow-files/test.txt"
      }
    }
  ]
}
```

**Expected Result:**
- Write succeeds with bytes_written
- Read returns the same content

---

### **Test 2: Code Execution**

**Use this prompt:**
```
"Execute a Python script that calculates 2+2 and saves the result to a file"
```

**Expected Steps:**
1. Execute Python code: `print(2 + 2)`
2. Write result to file
3. Success!

---

### **Test 3: Multi-Language**

**Use this prompt:**
```
"Run a Python script, a JavaScript script, and a Bash script, and combine their outputs"
```

**Expected:**
- All 3 languages execute
- Outputs combined
- No errors

---

## 📊 Monitoring Code Execution

### **Check Tool Performance:**
```javascript
// Via API
fetch('https://your-app.railway.app/api/analytics/learning')
  .then(r => r.json())
  .then(data => {
    const codeTools = data.tools.filter(t =>
      ['file_read', 'file_write', 'execute_code'].includes(t.tool)
    );
    console.log('Code tool performance:', codeTools);
  });
```

### **View Execution Logs:**
```sql
-- In your database
SELECT * FROM mcp_tool_usage
WHERE tool_name IN ('file_read', 'file_write', 'execute_code')
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔧 Troubleshooting

### **Error: "Access denied: Path must be within allowed directories"**
**Solution:** Use `/tmp/workflow-files/` or `/workflow-files/` as the base path

**Example:**
```json
// ❌ Wrong:
{ "path": "/home/user/file.txt" }

// ✅ Correct:
{ "path": "/tmp/workflow-files/file.txt" }
```

---

### **Error: "File not found"**
**Solution:** Make sure to create the file first with `file_write` before reading

**Example:**
```json
{
  "steps": [
    {
      "tool": "file_write",
      "input": { "path": "/tmp/workflow-files/data.txt", "content": "test" }
    },
    {
      "tool": "file_read",
      "input": { "path": "/tmp/workflow-files/data.txt" }
    }
  ]
}
```

---

### **Error: "Execution timeout after 30000ms"**
**Solution:** Optimize code or increase timeout

**Example:**
```json
{
  "tool": "execute_code",
  "input": {
    "language": "python",
    "code": "import time; time.sleep(5); print('Done')",
    "timeout": 10000  // 10 seconds instead of 30
  }
}
```

---

### **Error: "Command not found: python3"**
**Solution:** Use the correct language name: `python`, `javascript`, or `bash`

---

## 🎉 What's Next?

**Your Autopilot can now:**
- ✅ Read and analyze code
- ✅ Generate and write code
- ✅ Execute code in 3 languages
- ✅ Build automated code pipelines
- ✅ Create self-improving workflows

**Try these next:**
1. Generate a workflow that analyzes your codebase
2. Create an automated code quality checker
3. Build a data processing pipeline
4. Make a code documentation generator

---

## 📚 Additional Resources

### **MCP Tools Reference:**
- See `/public/config/MCP_TOOLS_DEFINITION.json` for complete tool specs
- All tools support retry logic and error handling
- Tools can be chained with variable substitution

### **Learning System:**
- Code execution patterns are learned automatically
- Tool performance tracked and optimized
- Failure patterns detected and prevented

### **API Documentation:**
- Workflow execution: `/api/execute-workflow`
- Tool performance: `/api/analytics/learning`
- Suggestions: `/api/workflow/suggestions`

---

## 🔐 Security Notes

**What's Protected:**
- ✅ Filesystem access restricted to specific directories
- ✅ Code execution is sandboxed
- ✅ Timeouts prevent infinite loops
- ✅ Environment variables limited
- ✅ Process isolation enforced

**What to Avoid:**
- ❌ Don't execute untrusted user input directly
- ❌ Don't try to access system files
- ❌ Don't run code in production without testing
- ❌ Don't store secrets in code files

---

**Your Workflow Autopilot is now a FULL-FEATURED CODE EXECUTION ENGINE!** 🚀

**Test it, experiment, and build amazing automated workflows!** 💪
