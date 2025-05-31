import React from 'react';
import ChatElements from './ChatElements';
import FA from 'react-fontawesome';

function Container({children}) {
    return <div className="ChatBoxContainer">{children}</div>;
}

function CloseChatBox({close}) {
    return (
        <button className="CloseChat" onClick={close}>
            <FA name="times"/>
            <span className="sr-only">Close Chat</span>
        </button>
    );
}

function ChatHeaderStatus({status}) {
    const color = status === 'online' ? 'text-success' : status === 'offline' ? 'text-muted' : 'text-muted';
    return (
        <span className="m-r">
      <FA name="circle" className={color}/>
    </span>
    );
}

function ChatBoxHeader({close, isExpanded, name, status, toggle}) {
    const screenReaderText = isExpanded ? 'Hide Chat' : 'Show Chat';
    return (
        <header className="ChatHeader" onClick={toggle} onKeyPress={toggle} tabIndex={0}>
            {status && <ChatHeaderStatus status={status}/>}
            <span className="sr-only">{screenReaderText}</span>
            {name}
            <CloseChatBox close={close}/>
        </header>
    );
}

const ChatBox = (props) => {
    const [expanded, setExpanded] = React.useState(false);
    const toggle = () => {
        setExpanded(!expanded);
    }
    return (
        <div className="ChatBox">
            <ChatBoxHeader
                name={props.name}
                toggle={toggle}
                isExpanded={expanded}
                status={props.status}
                close={props.close}
            />
            {expanded && <ChatElements image={props.image}/>}
        </div>
    );
}

const Chat = {
    Container: Container,
    ChatBox: ChatBox,
};

export default Chat;
