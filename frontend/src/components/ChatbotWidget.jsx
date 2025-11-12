import { useState } from "react";

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! 👋 I’m your SchedulAI assistant. Ask me about courses, schedules, or progress!" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    // Simulate AI reply
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "I'm still learning! Try asking about your schedule or a course." },
      ]);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="chatbot-button"
        onClick={() => setOpen(!open)}
        title="Chat with SchedulAI"
      >
        💬
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>SchedulAI Assistant</span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                color: "white",
                border: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "0.5rem",
                  textAlign: msg.from === "user" ? "right" : "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor:
                      msg.from === "user" ? "var(--scu-yellow)" : "var(--scu-gray)",
                    color: msg.from === "user" ? "var(--scu-dark)" : "var(--scu-dark)",
                    padding: "0.5rem 0.8rem",
                    borderRadius: "12px",
                    maxWidth: "75%",
                    textAlign: "left",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              placeholder="Ask me something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatbotWidget;