import React from 'react';
import { Avatar, Card, withStyles } from '@material-ui/core';
import dateformat from 'dateformat';
import PropTypes from 'prop-types';

import styles from './Post.styles';

const generateAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
};
const formatDate = date => dateformat(new Date(date), 'mmmm d, yyyy, h:MM:ss TT');
const Post = ({ classes, isMyMessage, message }) => {
  return (
    <div
      className={classes.wrapper}
      style={{ flexDirection: isMyMessage ? 'row-reverse' : 'row' }}
    >
      <Avatar
        className={classes.avatar}
        style={{
          backgroundColor: generateAvatarColor(message.author),
          fontSize: isMyMessage ? '10px' : 'auto'
        }}
      >
        {isMyMessage ? 'YOU' : message.author[0].toUpperCase()}
      </Avatar>
      <Card
        className={classes.card}
        key={message.id}
        style={{ backgroundColor: isMyMessage ? '#c7f7d4' : 'white' }}
      >
        <div className={classes.heading}>
          <div>
            @{isMyMessage ? 'You' : message.author}
          </div>
          <div className={classes.date}>
            {formatDate(message.updatedAt)}
          </div>
        </div>
        <Card
          className={classes.message}
          style={{ textAlign: isMyMessage ? 'right' : 'left' }}
        >
          {message.message}
        </Card>
      </Card>
    </div>
  );
};
Post.propTypes = {
  classes: PropTypes.shape(),
  isMyMessage: PropTypes.bool.isRequired,
  message: PropTypes.shape().isRequired
};

export default withStyles(styles)(Post);
