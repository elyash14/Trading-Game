import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../src/utilities/hashing'
const prisma = new PrismaClient()

async function main() {
    await prisma.user.upsert({
        where: { username: 'manager' },
        update: {},
        create: {
            username: 'manager',
            password: hashPassword("manager123"),
            name: 'Chandler Bing',
            role: Role.MANAGER,
        },
    })

    //create some shares (bulk insert)
    const sharesData = [
        {
            symbol: 'ABC',
            count: 200,
            rate: 20.00,
        },
        {
            symbol: 'DEF',
            count: 100,
            rate: 10.00,
        },
        {
            symbol: 'GHI',
            count: 250,
            rate: 15.25,
        },
    ];
    await prisma.share.createMany({
        data: sharesData,
        skipDuplicates: true,
    })

    // create a few users and portfolios 
    // prisma dont support bulk insert for nested relations
    const shares = await prisma.share.findMany({
        where: {
            symbol: {
                in: ['ABC', 'DEF', 'GHI'],
            }
        }
    });

    const users = [
        {
            username: 'user1',
            password: hashPassword("123"),
            name: 'Ross Geller',
            portfolio: {
                create: {
                    name: 'My Portfolio',
                    tradeHistories: {
                        create: [
                            {
                                shareId: shares[0].id,
                                count: 100,
                            },
                            {
                                shareId: shares[2].id,
                                count: 50,
                            }
                        ]
                    }
                }
            }
        },
        {
            username: 'user2',
            password: hashPassword("123"),
            name: 'Rachel Green',
            portfolio: {
                create: {
                    name: 'My Portfolio',
                    tradeHistories: {
                        create: [
                            {
                                shareId: shares[1].id,
                                count: 20,
                            },
                            {
                                shareId: shares[2].id,
                                count: 50,
                            }
                        ]
                    }
                }
            }
        },
        {
            username: 'user3',
            password: hashPassword("123"),
            name: 'Joey Tribbiani',
            portfolio: {
                create: {
                    name: 'My Portfolio',
                    tradeHistories: {
                        create: [
                            {
                                shareId: shares[0].id,
                                count: 25,
                            },
                            {
                                shareId: shares[1].id,
                                count: 20,
                            },
                            {
                                shareId: shares[2].id,
                                count: 70,
                            },
                        ]
                    }
                }
            }
        },
        {
            username: 'user4',
            password: hashPassword("123"),
            name: 'Phoebe Buffay',
            portfolio: {
                create: {
                    name: 'My Portfolio',
                    tradeHistories: {
                        create: [
                            {
                                shareId: shares[0].id,
                                count: 50,
                            },
                            {
                                shareId: shares[1].id,
                                count: 50,
                            },
                        ]
                    }
                }
            }
        },
        {
            username: 'user5',
            password: hashPassword("123"),
            name: 'Monica Geller',
            portfolio: {
                create: {
                    name: 'My Portfolio',
                    tradeHistories: {
                        create: [
                            {
                                shareId: shares[0].id,
                                count: 25,
                            },
                            {
                                shareId: shares[1].id,
                                count: 10,
                            },
                            {
                                shareId: shares[2].id,
                                count: 80,
                            },
                        ]
                    }
                }
            }
        }
    ];

    await Promise.all(users.map(user => prisma.user.upsert({
        where: { username: user.username },
        update: user,
        create: user,
    })));

    console.log('Initial data has been successfully created.');

}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })