import { useEffect, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationList } from "./ConversationList";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "./LoginForm";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";
import ProblemForm from "./NewProblemForm";
import { useHandleSubmit } from "@/hooks/useHandleSubmit";

export const ChatInterface = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeChat, setActiveChat] = useState<string>("");

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    removeConversation,
    createNewChat,
    fetchConversations,
    setConversations
  } = useConversations();

  const {
    isLoadingChat,
    isStreaming,
    handleSendMessage,
    handleStopGeneration
  } = useChat(setConversations, activeConversationId, conversations);

  const [problemFormSubmitted, setProblemFormSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Extract common function to ensure active chat is set
  const ensureActiveChat = <T extends (...args: any[]) => any>(callback: T) => {
    return (...args: Parameters<T>): ReturnType<T> => {
      setActiveChat(activeConversationId);
      return callback(...args);
    };
  };

  const handleSend = ensureActiveChat((message: string) => {
    handleSendMessage(message);
  });

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const { 
    formData, 
    handleSubmit: originalHandleSubmit, 
    handleChange, 
    isLoading, 
    isLoadingSolution 
  } = useHandleSubmit(
    activeConversationId,
    user?.id,
    setProblemFormSubmitted,
    setConversations
  );

  // Wrap the original handleSubmit with the ensureActiveChat function
  const handleSubmit = ensureActiveChat(originalHandleSubmit);

  // After createSolution, it never became false
  console.log("Active Conversation: ", activeConversationId)

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const hasMessages = activeConversation?.messages && activeConversation.messages.length > 0;
  const isConversationCompleted = activeConversation?.progress == 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <UserMenu />
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
        onDelete={removeConversation}
        onNewChat={createNewChat}
        user={user}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {!hasMessages ? (
          <div className="flex-1 overflow-y-auto">
            <div className="h-full flex bg-background items-center justify-left">
              <div className="text-left mt-[10%] px-8 w-full max-w-3xl mx-auto">
                <ProblemForm 
                  user={user} 
                  activeConversationId={activeConversationId}
                  setIsSubmitted={setProblemFormSubmitted}
                  setConversations={setConversations}
                  formData={formData}
                  handleSubmit={handleSubmit}
                  handleChange={handleChange}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <MessageList 
              messages={activeConversation.messages} 
              isLoadingChat={isLoadingChat && activeChat === activeConversationId} 
              isLoadingSolution={isLoadingSolution && activeChat === activeConversationId}
            />
            <MessageInput 
              onSend={handleSend} 
              onStop={handleStopGeneration}
              disabled={isLoadingChat || isConversationCompleted} 
              isGenerating={isStreaming}
              conversationId={activeConversationId}
              isCompleted={isConversationCompleted}
            />
          </>
        )}
      </div>
    </div>
  );
};
