import React, { Component } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { Button, TextField, withStyles } from '@material-ui/core';
import { Picker } from 'emoji-mart';
import PropTypes from 'prop-types';
import 'emoji-mart/css/emoji-mart.css';

import styles, { emojiStyle }  from './Form.styles';
import {createMessage} from '../../graphql/mutations';

const MAX_LENGTH = 160;
const DEFAULT_LABEL = 'Enter your message';
const ERROR_LABEL = `Max length for message is ${MAX_LENGTH} characters`;

class Form extends Component {
  state = {
    label: DEFAULT_LABEL,
    message: '',
    showEmojiPicker: false
  };

  handleAddEmoji = (emoji) => {
    const message = this.state.message.length === 0
      ? emoji
      : `${this.state.message}  ${emoji}`;

    this.setState({ message });
  };

  handleInputChange = event => {
    let message = event.target.value;

    if (message.length > MAX_LENGTH) {
      message = message.slice(0, MAX_LENGTH);
    }
    this.setState({
      isInputInvalid: message.length === MAX_LENGTH,
      label: message.length === MAX_LENGTH ? ERROR_LABEL : DEFAULT_LABEL,
      message
    });
  };

  handleInputKeyUp = event => {
    const { message } = this.state;

    if (event.key === 'Enter' && event.ctrlKey && message.length > 0) {
      this.postMessage();
    }
  };

  postMessage = async () => {
    const id = new Date().getTime();
    const { username } = this.props;
    const { message } = this.state;
    const data = {
      author: username,
      id,
      message
    };

    try {
      await API.graphql(graphqlOperation(createMessage, { input: data }));
      this.setState({ message: '' });
    } catch ({ message }) {
      throw new Error(message);
    }
  };

  toggleShowEmojiPicker = () => {
    this.setState({ showEmojiPicker: !this.state.showEmojiPicker });
  };

  render() {
    const { classes } = this.props;
    const { isInputInvalid, label, message, showEmojiPicker } = this.state;

    return (
      <>
        {showEmojiPicker && (
          <Picker
            style={emojiStyle}
            onSelect={({ native }) => this.handleAddEmoji(native)}
            showPreview={false}
          />
        )}
        <form
          className={classes.form}
          onSubmit={event => { event.preventDefault(); }}
        >
          <Button
            aria-label='Insert emoticon'
            color='primary'
            mini
            onClick={this.toggleShowEmojiPicker}
          >
            <i className='material-icons'>
              insert_emoticon
            </i>
          </Button>
          <TextField
            className={classes.textField}
            error={isInputInvalid}
            label={label}
            onKeyUp={this.handleInputKeyUp}
            onChange={this.handleInputChange}
            value={message}
          />
          <Button
            aria-label='Send'
            color='primary'
            disabled={message.length === 0}
            mini
            onClick={this.postMessage}
          >
            <i className='material-icons'>
              send
            </i>
          </Button>
        </form>
      </>
    )
  }
}
Form.propTypes = {
  classes: PropTypes.shape(),
  username: PropTypes.string.isRequired
};

export default withStyles(styles)(Form);
