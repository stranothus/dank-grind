export interface requirement {
    type: "inv",
    item: string
}

export interface command {
    command: string,
    arguments?: string[],
    cooldown?: number,
    repliesTo: boolean,
    match: RegExp,
    requirements: requirement[]
}

export interface item {
    buy: string,
    sell: string,
    description: string,
    id: string,
    rarity: string,
    type: string,
    name?: string
}