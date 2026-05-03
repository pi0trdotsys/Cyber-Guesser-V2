export type Difficulty = "easy" | "medium" | "hard";

export interface Snippet {
  id: string;
  language: string;
  difficulty: Difficulty;
  code: string;
  question: string;
  options: string[];
  answer: number;
  hint: string;
  explanation: string;
}

export const SNIPPETS: Snippet[] = [
  {
    id: "1",
    language: "JavaScript",
    difficulty: "easy",
    code: `const arr = [1, 2, 3, 4, 5];\nconst result = arr.filter(n => n % 2 === 0)\n                  .reduce((a, b) => a + b, 0);\nconsole.log(result);`,
    question: "What does this code print?",
    options: ["6", "15", "9", "0"],
    answer: 0,
    hint: "Filter even numbers, then sum them.",
    explanation: "Filters [2,4] then sums = 6.",
  },
  {
    id: "2",
    language: "Python",
    difficulty: "easy",
    code: `def mystery(n):\n    return n * (n + 1) // 2\n\nprint(mystery(10))`,
    question: "What does mystery(n) compute?",
    options: ["Factorial of n", "Sum 1..n", "n squared", "n-th Fibonacci"],
    answer: 1,
    hint: "Classic Gauss formula.",
    explanation: "n(n+1)/2 is the sum of integers 1 through n.",
  },
  {
    id: "3",
    language: "Kotlin",
    difficulty: "medium",
    code: `fun main() {\n    val s = "racecar"\n    println(s == s.reversed())\n}`,
    question: "What is printed?",
    options: ["true", "false", "racecar", "Error"],
    answer: 0,
    hint: "Is the string a palindrome?",
    explanation: "'racecar' reversed equals itself, so true.",
  },
  {
    id: "4",
    language: "C",
    difficulty: "hard",
    code: `int x = 5;\nint *p = &x;\nint **pp = &p;\n**pp = 42;\nprintf("%d", x);`,
    question: "What gets printed?",
    options: ["5", "42", "Address of x", "Undefined"],
    answer: 1,
    hint: "Double dereference writes through both pointers.",
    explanation: "**pp dereferences twice and writes 42 into x.",
  },
  {
    id: "5",
    language: "SQL",
    difficulty: "medium",
    code: `SELECT department, COUNT(*) AS cnt\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 5\nORDER BY cnt DESC;`,
    question: "What does this query return?",
    options: [
      "All employees grouped",
      "Departments with more than 5 employees, sorted by count desc",
      "Top 5 departments",
      "All departments alphabetically",
    ],
    answer: 1,
    hint: "HAVING filters groups after aggregation.",
    explanation: "Groups by dept, keeps those with >5 employees, sorts desc.",
  },
  {
    id: "6",
    language: "Rust",
    difficulty: "hard",
    code: `fn main() {\n    let s = String::from("hello");\n    let r = &s;\n    let r2 = &s;\n    println!("{} {}", r, r2);\n}`,
    question: "Does this compile and what does it print?",
    options: [
      "Compile error: borrow conflict",
      "Prints: hello hello",
      "Prints: hello",
      "Runtime panic",
    ],
    answer: 1,
    hint: "Multiple immutable borrows are allowed.",
    explanation: "Rust permits multiple shared (&) borrows simultaneously.",
  },
  {
    id: "7",
    language: "TypeScript",
    difficulty: "medium",
    code: `type Result<T> = { ok: true; value: T } | { ok: false; error: string };\n\nfunction parse(x: string): Result<number> {\n  const n = Number(x);\n  return isNaN(n) ? { ok: false, error: "NaN" } : { ok: true, value: n };\n}`,
    question: "What pattern is being implemented?",
    options: ["Singleton", "Discriminated union / Result type", "Decorator", "Mixin"],
    answer: 1,
    hint: "The 'ok' field discriminates the variants.",
    explanation: "Classic discriminated union for error-as-value handling.",
  },
  {
    id: "8",
    language: "Bash",
    difficulty: "easy",
    code: `for f in *.log; do\n  mv "$f" "\${f%.log}.txt"\ndone`,
    question: "What does this loop do?",
    options: [
      "Deletes all .log files",
      "Renames every .log file to .txt",
      "Prints contents of .log files",
      "Compresses .log files",
    ],
    answer: 1,
    hint: "${f%.log} strips the .log suffix.",
    explanation: "Iterates *.log and renames each to a .txt counterpart.",
  },
  {
    id: "9",
    language: "Go",
    difficulty: "medium",
    code: `ch := make(chan int, 2)\nch <- 1\nch <- 2\nclose(ch)\nfor v := range ch {\n    fmt.Println(v)\n}`,
    question: "What is the output?",
    options: ["1 2", "Deadlock", "Only 1", "Panic"],
    answer: 0,
    hint: "Buffered channel, then ranged after close.",
    explanation: "Two values buffered, channel closed; range prints 1 then 2.",
  },
  {
    id: "10",
    language: "Python",
    difficulty: "hard",
    code: `def f(x, lst=[]):\n    lst.append(x)\n    return lst\n\nprint(f(1))\nprint(f(2))`,
    question: "What gets printed?",
    options: ["[1] then [2]", "[1] then [1, 2]", "[1, 2] both times", "Error"],
    answer: 1,
    hint: "Default mutable argument gotcha.",
    explanation: "The default list is shared across calls — it accumulates.",
  },
];