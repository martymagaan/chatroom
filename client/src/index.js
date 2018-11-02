import React from 'react';
import ReactDOM from 'react-dom';
import socketIOClient from 'socket.io-client';
import './index.css';

const server = 'http://projects.martymagaan.com:3001';
let socket;

class Chatroom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      messages: []
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.viewUserList = this.viewUserList.bind(this);
    this.hideUserList = this.hideUserList.bind(this);
    this.shiftIsDown = false;
    this.newMessage = null;

    socket = socketIOClient(server);

    socket.on('load users', (users) => {
      if (!this.user) {
        const userlist = JSON.parse(users);
        this.setState({users: userlist});
        this.user = createUniqueUsername(props.username, userlist);
        socket.emit('user entered', this.user);
      }
    });

    socket.on('user entered', (data) => {
      const userData = JSON.parse(data);
      const newMessage = {
        announcement: userData.newUser + ' entered the room.'
      };
      this.setState({
        messages: this.state.messages.concat(newMessage),
        users: userData.users
      });
    });

    socket.on('user left', (data) => {
      const userData = JSON.parse(data);
      const newMessage = {
        announcement: userData.user + ' left the room.'
      };
      const messages = this.state.messages.concat(newMessage);
      this.setState({messages: messages, users: userData.users});
    });

    socket.on('send message', (message) => {
      const newMessage = JSON.parse(message);
      const messages = this.state.messages.concat(newMessage);
      this.setState({messages: messages});
    });
  }

  componentDidMount() {
    document.getElementById('chat-textarea').focus();
  }

  componentDidUpdate() {
    const chatList = document.getElementById('chat-list');
    chatList.scrollTop = chatList.scrollHeight;
  }

  handleChange(event) {
    this.newMessage = {
      user: this.user,
      message: event.target.value,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  handleSubmit(event) {
    if (this.newMessage) {
      const message = JSON.stringify(this.newMessage);
      socket.emit('send message', message);
      document.getElementById('chat-form').reset();
      document.getElementById('chat-textarea').focus();
      this.newMessage = null;
    }
    event.preventDefault();
  }

  handleKeyPress(event) {
    if (event.key === 'Enter' && !this.shiftIsDown)
      this.handleSubmit(event);
  }

  handleKeyDown(event) {
    if (event.key === 'Shift')
      this.shiftIsDown = true;
  }

  handleKeyUp(event) {
    if (event.key === 'Shift')
      this.shiftIsDown = false;
  }

  viewUserList() {
    const userList = document.getElementById('user-list-container');
    userList.style.visibility = 'visible';
    const viewButton = document.getElementById('view-user-list');
    viewButton.style.display = 'none';
    const hideButton = document.getElementById('hide-user-list');
    hideButton.style.display = 'inline-block';
  }

  hideUserList() {
    const userList = document.getElementById('user-list-container');
    userList.style.visibility = 'hidden';
    const hideButton = document.getElementById('hide-user-list');
    hideButton.style.display = 'none';
    const viewButton = document.getElementById('view-user-list');
    viewButton.style.display = 'inline-block';
  }

  render() {
    const messages = this.state.messages;
    const chatPosts = messages.map((chatPost, id) => {
      if (chatPost.announcement) {
        return (
          <li key={id}>
            <span className="chat-announcement">
              {chatPost.announcement}
            </span>
          </li>
        );
      } else {
        const color = chatPost.user === this.user ? 'red' : 'blue';
        return (
          <li key={id}>
            <span className="chat-username" style={{color: color}}>
              {chatPost.user}
            </span>
            <span className="chat-message">
              : {chatPost.message}
            </span>
            <div className="chat-timestamp">
              {chatPost.timestamp}
            </div>
          </li>
        );
      }
    });

    const users = this.state.users;
    const userListItems = users.map((username, id) => {
      const color = username === this.user ? 'red' : 'blue';
      return <li key={id} style={{color: color}}>{username}</li>;
    });

    return (
      <div id="chat-room">
        <div id="chat-box">
          <div id="chat-list-container">
            <ul id="chat-list">{chatPosts}</ul>
          </div>
          <div id="user-list-container">
            <ul id="user-list">{userListItems}</ul>
          </div>
        </div>
        <form id="chat-form" onSubmit={this.handleSubmit}>
          <textarea
            id="chat-textarea"
            onChange={this.handleChange}
            onKeyPress={this.handleKeyPress}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
          />
          <input id ="chat-button" type="submit" value="Chat" />
          <button id="view-user-list" onClick={this.viewUserList}>
            View User List
          </button>
          <button id="hide-user-list" onClick={this.hideUserList}>
            Hide User List
          </button>
        </form>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {username: null};
    this.inputValue = null;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    document.getElementById('username-input').focus();
  }

  handleChange(event) {
    this.inputValue = event.target.value;
  }

  handleSubmit(event) {
    this.setState({
      username: this.inputValue
    });
    event.preventDefault();
  }

  render() {
    if (!this.state.username) {
      return (
        <div id="create-user-screen">
          <img id="logo" src="img/chatroom.svg" alt="Chatroom logo" />
          <form id="username-form" onSubmit={this.handleSubmit}>
            <input
              id="username-input"
              type="text"
              placeholder="Enter username"
              autoComplete="off"
              onChange={this.handleChange}
            />
            <br />
            <input
              id="username-submit"
              type="submit"
              value="Enter"
            />
          </form>
        </div>
      );
    }
    else
      return <Chatroom username={this.state.username} />;
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

function createUniqueUsername(username, users) {
  let num = 1;
  let suffix = '';
  while (users.includes(username + suffix)) {
    suffix = '(' + (++num) + ')';
  }
  return username + suffix;
}
