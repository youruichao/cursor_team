import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ── 类型定义 ──────────────────────────────────────────────
interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

// ── 数据持久化 ────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, "../todos.json");

function loadTodos(): Todo[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Todo[];
}

function saveTodos(todos: Todo[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), "utf-8");
}

// ── CRUD 操作 ─────────────────────────────────────────────
function addTodo(todos: Todo[], title: string): Todo {
  const newTodo: Todo = {
    id: Date.now(),
    title: title.trim(),
    done: false,
    createdAt: new Date().toLocaleString("zh-CN"),
  };
  todos.push(newTodo);
  saveTodos(todos);
  return newTodo;
}

function completeTodo(todos: Todo[], id: number): boolean {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return false;
  todo.done = true;
  saveTodos(todos);
  return true;
}

function deleteTodo(todos: Todo[], id: number): boolean {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  saveTodos(todos);
  return true;
}

// ── 显示 ──────────────────────────────────────────────────
function printTodos(todos: Todo[]): void {
  if (todos.length === 0) {
    console.log("  （暂无任务）");
    return;
  }
  console.log("");
  todos.forEach((t) => {
    const status = t.done ? "✅" : "⬜";
    const title = t.done ? `\x1b[9m${t.title}\x1b[0m` : t.title;
    console.log(`  ${status} [${t.id}] ${title}  （${t.createdAt}）`);
  });
  console.log("");
}

function printHelp(): void {
  console.log(`
╔══════════════════════════════════════╗
║         📝 TypeScript Todo 管理器     ║
╚══════════════════════════════════════╝
命令：
  list              列出所有任务
  add <内容>         添加新任务
  done <id>         标记任务为已完成
  delete <id>       删除任务
  help              显示帮助
  exit              退出程序
`);
}

// ── 主交互循环 ────────────────────────────────────────────
async function main(): Promise<void> {
  const todos = loadTodos();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printHelp();

  const prompt = (): void => {
    rl.question("\x1b[36m> \x1b[0m", (input) => {
      const [cmd, ...args] = input.trim().split(/\s+/);
      const arg = args.join(" ");

      switch (cmd) {
        case "list":
          printTodos(todos);
          break;

        case "add":
          if (!arg) {
            console.log("  ⚠️  请输入任务内容，例如：add 买咖啡");
          } else {
            const t = addTodo(todos, arg);
            console.log(`  ✅ 已添加任务 [${t.id}]：${t.title}`);
          }
          break;

        case "done": {
          const id = Number(arg);
          if (!id) {
            console.log("  ⚠️  请输入有效的任务 ID");
          } else if (completeTodo(todos, id)) {
            console.log(`  ✅ 任务 [${id}] 已标记为完成`);
          } else {
            console.log(`  ❌ 找不到 ID 为 ${id} 的任务`);
          }
          break;
        }

        case "delete": {
          const id = Number(arg);
          if (!id) {
            console.log("  ⚠️  请输入有效的任务 ID");
          } else if (deleteTodo(todos, id)) {
            console.log(`  🗑️  任务 [${id}] 已删除`);
          } else {
            console.log(`  ❌ 找不到 ID 为 ${id} 的任务`);
          }
          break;
        }

        case "help":
          printHelp();
          break;

        case "exit":
        case "quit":
          console.log("  👋 再见！");
          rl.close();
          return;

        case "":
          break;

        default:
          console.log(`  ❓ 未知命令 "${cmd}"，输入 help 查看帮助`);
      }

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
