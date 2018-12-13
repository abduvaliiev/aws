import React, { Component } from 'react';
import Amplify, { Auth, API, graphqlOperation } from 'aws-amplify';
import { Fab, LinearProgress, withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import { withAuthenticator } from 'aws-amplify-react';

import aws_exports from '../../aws-exports';
import { listMessages, } from '../../graphql/queries';
import { onCreateMessage, } from '../../graphql/subscriptions';
import styles from './App.styles';
import Form from '../Form';
import Post from '../Post';

Amplify.configure(aws_exports);

const MESSAGES_PER_GROUP = 10;

class App extends Component {
  static propTypes = {
    classes: PropTypes.shape()
  };

  state = {
    currentGroup: 1,
    hasMore: false,
    isInputInvalid: false,
    loading: true,
    message: '',
    messages: [],
    showScrollDownIcon: false,
    username: ''
  };

  componentDidMount() {
    this.fetchMessages();
    this.subscribe();
    this.getUserName();
  }

  componentWillUnmount() {
    this.state.subscription.unsubscribe();
  }

  getUserName() {
    Auth.currentAuthenticatedUser()
      .then(({ username }) => {
        this.setState({ username });
      });
  }

  loadMoreMessages() {
    const { allMessages, currentGroup } = this.state;

    if ((currentGroup + 1) * MESSAGES_PER_GROUP >= allMessages.length) {
      this.setState({
        hasMore: false,
        messages: allMessages
      });

      return;
    }
    this.setState({
      currentGroup: currentGroup + 1,
      messages: allMessages.slice(allMessages.length - (currentGroup + 1) * MESSAGES_PER_GROUP)
    });
  };

  scrollToLatest() {
    // to make scroll smooth only for automatic scroll
    this.scrollParentRef.classList.add('animatedscroll');
    this.scrollParentRef.scrollTop = this.scrollParentRef.scrollHeight;
    this.scrollParentRef.classList.remove('animatedscroll');

    // to prevent messages loading on first automatic scroll
    setTimeout(() => this.setState( () => ({ hasMore: true })), 2000);
  }

  sortMessages(messages) {
    return messages
      .sort((a, b) => new Date(a.updatedAt) < new Date(b.updatedAt) ? 1 : -1)
      .reverse();
  }

  subscribe() {
    const subscription = API.graphql(graphqlOperation(onCreateMessage))
      .subscribe({
        next: ({ value: { data: { onCreateMessage } } }) => {
          this.setState({
            messages: this.sortMessages([...this.state.messages, onCreateMessage])
          });
          this.scrollToLatest();
        }
      });

    this.setState({ subscription });
  }

  fetchMessages = async () => {
    // I haven't found a way to query data from dynamoDB, which is ordered by date, so infinite scroll is implemented
    // on client side
    const variables = {
      limit: 99999
    };

    try {
      const messages = await API.graphql(graphqlOperation(listMessages, variables));
      const sortedMessages = this.sortMessages(messages.data.listMessages.items);

      this.setState({
        allMessages: sortedMessages,
        loading: false,
        messages: sortedMessages.slice(sortedMessages.length - MESSAGES_PER_GROUP)
      });

      this.scrollToLatest();
    } catch ({ message }) {
      throw new Error(message);
    }
  };

  handleMessageScroll = () => {
    const messages = this.scrollParentRef;
    const showScrollDownIcon = messages.scrollHeight - messages.scrollTop > messages.clientHeight * 2;

    if (showScrollDownIcon !== this.state.showScrollDownIcon) {
      this.setState({ showScrollDownIcon });
    }

    if (messages.scrollTop < 100 && this.state.hasMore) {
      this.loadMoreMessages();
    }
  };

  render() {
    const {
      loading, messages, showScrollDownIcon, username
    } = this.state;
    const { classes } = this.props;

    return (
      <div className={classes.wrapper}>
        {showScrollDownIcon && (
          <Fab
            aria-label='Scroll down'
            className={classes.scrollDownButton}
            color='primary'
            onClick={() => this.scrollToLatest()}
            size='small'
          >
            <i className='material-icons'>
              keyboard_arrow_down
            </i>
          </Fab>
        )}
        {loading && <LinearProgress color='primary' />}
        <div
          className={classes.messages}
          ref={ref => this.scrollParentRef = ref}
          onScroll={this.handleMessageScroll}
        >
          {messages.map(message => {
            const isMyMessage = message.author === username;

            return (
              <Post
                isMyMessage={isMyMessage}
                key={message.id}
                message={message}
              />
            );
          })}
        </div>
        <Form username={username} />
      </div>
    );
  }
}

export default withAuthenticator(
  withStyles(styles)(App), true
);
