import { useAgent } from "@/hooks/useAgent";
import { Message } from "@/lib/store/chatStore";

export function StreamingIndicator({ pendingCommand, messages }: { pendingCommand: string, messages: Message[] }) {
    const agent = useAgent();

    return (
        <div className="flex flex-col pl-1 animate-fade-in mb-8">
            {/* Display user's command in the right-aligned bubble format */}
            {pendingCommand && messages.length === 0 && (
                <div className="flex justify-end mb-6">
                    <div className="bg-muted/40 border border-border/40 rounded-2xl px-4 py-3 text-sm max-w-[80%]">
                        <p className="text-foreground whitespace-pre-wrap">{pendingCommand}</p>
                    </div>
                </div>
            )}
            <div className="space-y-2 w-full">
                <div className="text-sm text-foreground whitespace-pre-wrap">
                    {agent.content ? (
                        <div className="animate-fade-in">
                            {agent.content}
                        </div>
                    ) : (
                        <div className="animate-pulse">
                            <span className="inline-block w-3 h-4">■</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
