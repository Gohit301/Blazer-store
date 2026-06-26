import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Product } from "../types";
import { PRODUCTS } from "../data";
import { Sparkles, Send, X, Bot, User, Check, Eye, ShoppingBag, ArrowRight } from "lucide-react";

interface AIDecorAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onTryInAR: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const STARTER_PROMPTS = [
  "Suggest a cozy reading corner configuration.",
  "Which items match a classic leather sofa?",
  "How can I style jute stools in a modern Nordic setting?",
  "Recommend durable poufs for active floor seating."
];

export default function AIDecorAssistant({
  isOpen,
  onClose,
  onTryInAR,
  onAddToCart,
}: AIDecorAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Welcome to Loom & Layer Studio. I am your AI Interior Decor Advisor. I can recommend premium soft furnishings, suggest tonal pairings, and help you configure layouts. What space can I help you design today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Map message history into standard parts format for Server-Side route
      const history = messages.concat(userMsg).map((msg) => ({
        role: msg.sender === "ai" ? "ai" : "user",
        parts: [{ text: msg.text }],
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        throw new Error("Chat server failed to respond");
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: data.suggestedProducts || [],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: "ai",
        text: "I am experiencing a small connectivity hiccup. Rest assured, our local design blueprints are active. I recommend styling the Aarya Cotton Pouf [sg-001] paired with a warm Kashmir Merino Throw [sg-007]. Let me know if you would like me to retry connection!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: ["sg-001", "sg-007"],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to extract product details for suggestions
  const getProductsFromCodes = (codes: string[] = []): Product[] => {
    return PRODUCTS.filter((p) => codes.includes(p.id));
  };

  // Simple clean formatting to convert double stars to bold HTML tags
  const formatMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-editorial-ink">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-editorial-ink/40 backdrop-blur-xs animate-fade-in">
      {/* Click-to-close backdrop */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Slide-out Drawer container */}
      <div className="relative flex h-full w-full max-w-md flex-col bg-white border-l border-editorial-border shadow-2xl animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-editorial-border bg-editorial-accent-soft px-5 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-editorial-ink bg-transparent text-editorial-ink shadow-sm">
              <Sparkles className="h-4.5 w-4.5 text-editorial-accent animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-editorial-ink leading-none">
                AI Interior Advisor
              </h2>
              <span className="text-[9px] text-editorial-accent font-bold uppercase tracking-wider block mt-1">
                Loom & Layer Design Studio • Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-none bg-white border border-editorial-border hover:bg-editorial-ink hover:text-white hover:border-editorial-ink text-editorial-accent transition-all cursor-pointer shadow-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-editorial-accent-soft/30">
          {messages.map((msg) => {
            const isAI = msg.sender === "ai";
            const suggestedProds = getProductsFromCodes(msg.suggestedProducts);

            return (
              <div key={msg.id} className={`flex flex-col space-y-1.5 ${isAI ? "" : "items-end"}`}>
                
                {/* Sender Indicator */}
                <div className="flex items-center space-x-1.5 text-[9px] font-bold text-editorial-accent uppercase tracking-widest px-1">
                  {isAI ? (
                    <>
                      <Bot className="h-3 w-3 text-editorial-accent" />
                      <span>Loom & Layer Advisor</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" />
                      <span>You</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Chat Bubble content */}
                <div
                  className={`max-w-[85%] rounded-none px-4 py-3 text-xs leading-relaxed font-light shadow-xs border ${
                    isAI
                      ? "bg-white text-editorial-ink border-editorial-border"
                      : "bg-editorial-ink text-white border-editorial-ink"
                  }`}
                >
                  <p>{formatMessageText(msg.text)}</p>
                </div>

                {/* SUGGESTED PRODUCT WIDGETS (embedded directly inside feed) */}
                {isAI && suggestedProds.length > 0 && (
                  <div className="mt-2 w-full max-w-[85%] space-y-2 animate-fade-in pl-1">
                    <span className="text-[9px] font-bold text-editorial-accent tracking-wider block uppercase">Staging Options:</span>
                    <div className="space-y-1.5">
                      {suggestedProds.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-2 rounded-none bg-white border border-editorial-border shadow-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="h-10 w-10 object-cover rounded-none border border-editorial-border/30"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="text-[11px] font-bold text-editorial-ink line-clamp-1">{prod.name}</h4>
                              <span className="text-[10px] font-serif font-bold text-editorial-ink">${prod.price}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => onTryInAR(prod)}
                              className="flex h-7 px-2 items-center space-x-1 rounded-none border border-editorial-border bg-editorial-accent-soft text-[9px] uppercase tracking-wider font-bold text-editorial-ink hover:bg-editorial-ink hover:text-white transition-all cursor-pointer"
                              title="Try in Room"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline">Try</span>
                            </button>
                            <button
                              onClick={() => onAddToCart(prod)}
                              className="flex h-7 w-7 items-center justify-center rounded-none bg-editorial-ink text-white hover:bg-editorial-accent transition-all cursor-pointer"
                              title="Add to cart"
                            >
                              <ShoppingBag className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-1.5 text-[9px] font-bold text-editorial-accent uppercase tracking-widest px-1">
                <Bot className="h-3 w-3 text-editorial-accent" />
                <span>Advisor is drafting ideas...</span>
              </div>
              <div className="flex space-x-1 bg-white p-3 rounded-none w-14 items-center justify-center border border-editorial-border shadow-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-editorial-accent animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-editorial-accent animate-bounce delay-75" />
                <div className="h-1.5 w-1.5 rounded-full bg-editorial-accent animate-bounce delay-150" />
              </div>
            </div>
          )}

          {/* Dummy anchor for scrolls */}
          <div ref={chatEndRef} />
        </div>

        {/* Starter Prompts tray */}
        {messages.length === 1 && (
          <div className="px-5 py-4 bg-editorial-accent-soft border-t border-editorial-border space-y-2">
            <span className="text-[9px] font-bold text-editorial-accent tracking-wider block uppercase">Staging Starters:</span>
            <div className="flex flex-col space-y-1.5">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-center justify-between text-left text-[11px] font-medium text-editorial-ink/80 bg-white border border-editorial-border p-2.5 rounded-none hover:bg-editorial-accent-soft hover:text-editorial-ink transition-all cursor-pointer group"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="h-3 w-3 text-editorial-accent group-hover:text-editorial-ink group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Dock */}
        <div className="border-t border-editorial-border bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask about textures, matching items..."
              className="flex-1 rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs leading-none text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-none bg-editorial-ink text-white hover:bg-editorial-accent transition-all disabled:opacity-30 disabled:hover:bg-editorial-ink cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
