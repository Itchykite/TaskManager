import readlineSync from "readline-sync";
import chalk from "chalk";
import { v4 as uuidv4} from "uuid";
import fs from "fs";

class Task
{
uuid: string;
    name: string;
    description: string;
    priority: number;
    status: string;

    constructor(uuid: string, name: string, priority: number, description: string, status: string);
    constructor(name: string, priority: number, description: string);

    constructor
    (
        uuidOrName: string,
        nameOrPriority: string | number,
        priorityOrDescription?: number | string,
        descriptionOrStatus?: string,
        statusOpt?: string
    ) 
    {
        if 
        (
            typeof priorityOrDescription === 'number' &&
            typeof descriptionOrStatus === 'string' &&
            typeof statusOpt === 'string'
        )
        {
            this.uuid = uuidOrName;
            this.name = nameOrPriority as string;
            this.priority = priorityOrDescription;
            this.description = descriptionOrStatus;
            this.status = statusOpt;
        } 
        
        else if
        (
            typeof nameOrPriority === 'number' &&
            typeof priorityOrDescription === 'string'
        )
        {
            this.uuid = uuidv4();
            this.name = uuidOrName;
            this.priority = nameOrPriority;
            this.description = priorityOrDescription;
            this.status = "oczekujące";
        } 

        else
        {
            throw new Error("Nieprawidłowe argumenty konstruktora Task.");
        }
    }
}
class TaskManager
{
    tasks: Task[];
    private filePath = "tasks.json";

    constructor()
    {
        this.tasks = [];
        this.loadTasksFromFile();
    }

    loadTasksFromFile(): void
    {
        if (fs.existsSync(this.filePath)) 
        {
            const content = fs.readFileSync(this.filePath, "utf-8");
            const parsed: Task[] = JSON.parse(content);
            this.tasks = parsed.map(t => new Task(t.uuid, t.name, t.priority, t.description, t.status));
        }
    }

    saveTasksToFile(): void
    {
        fs.writeFileSync(this.filePath, JSON.stringify(this.tasks, null, 2), "utf-8");
    }

    addTask(task: Task)
    {
        this.tasks.push(task);
        this.saveTasksToFile();
    }

    removeTask(uuid: string)
    {
        this.tasks = this.tasks.filter(task => task.uuid !== uuid);
        this.saveTasksToFile();
    }

    setTaskStatus(uuid: string, status: string)
    {
        const task = this.tasks.find(task => task.uuid === uuid);
        if (task)
        {
            task.status = status;
            this.saveTasksToFile();
        }
    }

    uuidExists(uuid: string): boolean 
    {
        return this.tasks.some(task => task.uuid === uuid);
    }

    getTasks()
    {
        return this.tasks;
    }
}

const taskManager = new TaskManager();

while (true)
{
    console.clear();

    console.log(chalk.blue("Wybierz opcję:"));
    console.log(chalk.green("1. Dodaj zadanie"));
    console.log(chalk.yellow("2. Wyświetl zadania"))
    console.log(chalk.magenta("3. Zmień status zadania"));
    console.log(chalk.cyan("4. Usuń zadanie"));
    console.log(chalk.red("5. Zakończ"));

    const choice = readlineSync.question("Wybór: ");

    if (choice === "1")
    {
        console.clear();
        const name = readlineSync.question("Nazwa zadania: ");
        const description = readlineSync.question("Opis zadania: ");
        const priority = parseInt(readlineSync.question("Priorytet zadania (1-5): "), 10);

        if (isNaN(priority) || priority < 1 || priority > 5)
        {
            console.log(chalk.red("Nieprawidłowy priorytet!"));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
            continue;
        }

        if (!name)
        {
            console.log(chalk.red("Nazwa jest wymagana!"));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
            continue;
        }
        
        const task = new Task(name, priority, description);
        taskManager.addTask(task);
        console.log(chalk.green("Zadanie dodane!"));
        readlineSync.question("\nNaciśnij ENTER, aby kontynuować...");
    }

    else if (choice === "2")
    {
        console.clear();
        const tasks = taskManager.getTasks();
        if (tasks.length === 0)
        {
            console.log(chalk.yellow("Brak zadań do wyświetlenia."));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
        }
        else
        {
            tasks.forEach((task) =>
            {
                if(task.status === "oczekujące")
                {
                    console.log(chalk.yellow(`UUID: ${task.uuid}, Nazwa: ${task.name}, Opis: ${task.description}, Priorytet: ${task.priority}, Status: ${task.status}`));
                }
                else if(task.status === "w trakcie")
                {
                    console.log(chalk.blue(`UUID: ${task.uuid}, Nazwa: ${task.name}, Opis: ${task.description}, Priorytet: ${task.priority}, Status: ${task.status}`));
                }
                else if(task.status === "zakończone")      
                {
                    console.log(chalk.green(`UUID: ${task.uuid}, Nazwa: ${task.name}, Opis: ${task.description}, Priorytet: ${task.priority}, Status: ${task.status}`));
                }
            });
            
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
        }
    }

    else if (choice === "3")
    {
        console.clear();
        const uuid = readlineSync.question("Podaj UUID zadania: ");
        const status = readlineSync.question("Podaj nowy status (oczekujące, w trakcie, zakończone): ");

        if (!uuid)
        {
            console.log(chalk.red("UUID jest wymagane!"));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
            continue;
        }

        if (!taskManager.uuidExists(uuid))
        {
            console.log(chalk.red("Nie znaleziono zadania o podanym UUID!"));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
            continue;
        }

        if (!["oczekujące", "w trakcie", "zakończone"].includes(status))
        {
            console.log(chalk.red("Nieprawidłowy status!"));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
            continue;
        }

        taskManager.setTaskStatus(uuid, status);
        taskManager.saveTasksToFile();
        console.log(chalk.green("Status zadania zaktualizowany!"));
        readlineSync.question("\nNaciśnij ENTER, aby kontynuować...");
    }

    else if (choice === "4")
    {
        console.clear();
        const uuid = readlineSync.question("Podaj UUID zadania do usunięcia: ");
        
        if (!uuid)
        {
            console.log(chalk.red("UUID jest wymagane!"));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
            continue;
        }

        if (!taskManager.uuidExists(uuid))
        {
            console.log(chalk.red("Nie znaleziono zadania o podanym UUID!"));
            readlineSync.question("\nNaciśnij ENTER, aby wrócić...");
            continue;
        }

        taskManager.removeTask(uuid);
        console.log(chalk.green("Zadanie usunięte!"));
        readlineSync.question("\nNaciśnij ENTER, aby kontynuować...");
    }

    else if (choice === "5")
    {
        console.clear();
        break;
    }
    else
    {
        console.clear();
        console.log(chalk.red("Nieprawidłowy wybór!"));
    }
}
