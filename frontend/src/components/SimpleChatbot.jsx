// src/components/SimpleChatbot.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SimpleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I can help you navigate SchedulAI. What do you need help with?' }
  ]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const keywordResponses = {
    schedule: {
      message: "I can help you with scheduling! Would you like to:",
      actions: [
        { text: "Plan my schedule", action: () => navigate("/schedule-planner") },
        { text: "View my current schedule", action: () => navigate("/dashboard") }
      ]
    },
    profile: {
      message: "I can help you with your profile. Would you like to:",
      actions: [
        { text: "View/edit my profile", action: () => navigate("/profile") },
        { text: "Change my password", action: () => navigate("/profile") }
      ]
    },
    dashboard: {
      message: "Let me take you to your dashboard where you can see your current courses and upload transcripts.",
      actions: [
        { text: "Go to Dashboard", action: () => navigate("/dashboard") }
      ]
    },
    transcript: {
      message: "I can help you with your transcript. Would you like to:",
      actions: [
        { text: "Upload transcript", action: () => navigate("/dashboard") },
        { text: "View current transcript", action: () => navigate("/dashboard") }
      ]
    },
    course: {
      message: "I can help you with course information. Would you like to:",
      actions: [
        { text: "Plan my courses", action: () => navigate("/schedule-planner") },
        { text: "View current courses", action: () => navigate("/dashboard") }
      ]
    },
    plan: {
      message: "Let me help you plan your academic schedule!",
      actions: [
        { text: "Open Schedule Planner", action: () => navigate("/schedule-planner") }
      ]
    },
    admin: {
      message: "For administrative tasks:",
      actions: [
        { text: "Admin Dashboard", action: () => navigate("/admin") }
      ]
    },
    help: {
      message: "Here are the main things you can do in SchedulAI:",
      actions: [
        { text: "Plan Schedule", action: () => navigate("/schedule-planner") },
        { text: "View Dashboard", action: () => navigate("/dashboard") },
        { text: "Edit Profile", action: () => navigate("/profile") }
      ]
    }
  };

  const findKeywords = (message) => {
    const lowerMessage = message.toLowerCase();
    const foundKeywords = [];
    
    Object.keys(keywordResponses).forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    });
    
    return foundKeywords;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    const keywords = findKeywords(input);
    
    let botResponse;
    if (keywords.length > 0) {
      const keyword = keywords[0]; // Use first found keyword
      botResponse = {
        type: 'bot',
        text: keywordResponses[keyword].message,
        actions: keywordResponses[keyword].actions
      };
    } else {
      botResponse = {
        type: 'bot',
        text: "I can help you navigate SchedulAI. Try asking about 'schedule', 'profile', 'dashboard', 'courses', or 'help' for quick navigation options."
      };
    }

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#8B1538',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '350px',
          height: '400px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#8B1538',
            color: 'white',
            padding: '15px',
            borderRadius: '10px 10px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 'bold' }}>SchedulAI Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {messages.map((message, index) => (
              <div key={index}>
                <div style={{
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: message.type === 'user' ? '#8B1538' : '#f1f1f1',
                  color: message.type === 'user' ? 'white' : 'black',
                  padding: '10px',
                  borderRadius: '10px',
                  maxWidth: '80%',
                  fontSize: '14px'
                }}>
                  {message.text}
                </div>
                {message.actions && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {message.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={action.action}
                        style={{
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {action.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '15px',
            borderTop: '1px solid #ddd',
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSend}
              style={{
                backgroundColor: '#8B1538',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SimpleChatbot;