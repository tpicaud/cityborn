export default interface Player {
    id: string;
    inGame: boolean;
    connected?: boolean;
    sessionId?: string;
}