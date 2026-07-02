import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { db } from './db/db.ts';
import { removeElement, UserRole } from 'boardgame-web-common';

interface Command {
    name: string
    func: ((args: string[]) => void) | undefined
    description: string
    subCommands: Command[] | undefined
}

function conmandDescription(command: Command, tabs: string) {
    console.log(`${tabs}${command.name} - ${command.description} \r\n`)
    if (command.subCommands) {
        command.subCommands.forEach(sub => conmandDescription(sub, tabs + '  '))
    }
}

export async function startCli() {
    const rl = readline.createInterface({ input, output });

    const commands: Command[] = [
        {
            name: 'exit',
            func: () => {
                process.exit(0);
            },
            description: "Shutdown server",
            subCommands: undefined
        },
        {
            name: 'users',
            func: undefined,
            description: 'User commands:',
            subCommands: [
                {
                    name: 'list',
                    func: () => {
                        const allUsers = db.getAllUsers()
                        console.log(allUsers)
                    },
                    description: 'List all users',
                    subCommands: undefined
                },
                {
                    name: 'roles',
                    func: undefined,
                    description: 'User roles commands:',
                    subCommands: [
                        {
                            name: 'add',
                            func: (args: string[]) => {
                                const userId = args[0]!
                                const role = args[1]! as UserRole
                                const isValidRole = Object.values(UserRole).includes(role);
                                if (!isValidRole) {
                                    console.log(`Invalid role "${role}"`)
                                    return
                                }
                                const user = db.getUser(userId)
                                if (!user) {
                                    console.log(`No user with id "${userId}"`)
                                    return
                                }
                                if (user.roles.includes(role)) {
                                    console.log(`User already have role "${role}"`)
                                    return
                                }
                                user.roles.push(role)
                                db.updateUser(user)
                                console.log(user)
                            },
                            description: `Add role. Args: [user id] [role](${Object.values(UserRole).join(', ')})`,
                            subCommands: undefined
                        },
                        {
                            name: 'remove',
                            func: (args: string[]) => {
                                const userId = args[0]!
                                const role = args[1]! as UserRole
                                const user = db.getUser(userId)
                                if (!user) {
                                    console.log(`No user with id "${userId}"`)
                                    return
                                }
                                removeElement(user.roles, role)
                                db.updateUser(user)
                                console.log(user)
                            },
                            description: `Remove role. Args: [user id] [role](${Object.values(UserRole).join(', ')})`,
                            subCommands: undefined
                        }
                    ]
                }
            ]
        },
        {
            name: 'help',
            func: () => {
                console.log('List of all commands: \r\n')
                commands.forEach(cmd => {
                    conmandDescription(cmd, '')
                })
            },
            description: 'help command',
            subCommands: undefined
        }
    ]

    function runCommand(command: Command, args: string[]) {
        if (command.func) {
            command.func(args)
            return
        }
        const subCommandName = args[0]!
        const subCommand = command.subCommands?.find(cmd => cmd.name == subCommandName)
        if (subCommand) {
            runCommand(subCommand, args.slice(1))
        } else {
            console.log(`Unknown subcommand "${subCommandName}"`)
        }
    }

    while (true) {
        try {
            const answer = await rl.question('>');
            let commandArgs = answer.split(' ')
            if (commandArgs.length > 0) {

                let commandName = commandArgs[0]!
                let command = commands.find(cmd => cmd.name == commandName)
                if (command) {
                    runCommand(command, commandArgs.slice(1))
                } else {
                    console.log(`Unknown command "${commandName}"`)
                }
            }
        } catch (error) {
            console.log('Error: ', error)
        }
    }

    rl.close();
}

