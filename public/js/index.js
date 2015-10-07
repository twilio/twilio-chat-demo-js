'use strict';

var activeChannel = null;
var allChannels = [];
var client = null;
var fingerprint = new Fingerprint2();
var password = '8RqK2t9v1MP29WO';
var request = window.superagent;

$(document).ready(function() {
  $('#login-button').on('click', function() {
    var identity = $('#login input').val();
    if (!identity || !identity.length) { return; }

    fingerprint.get(function(result) {
      logIn(identity, result);
    });
  });

  $('#login input').focus()
    .on('keydown', function(e) { if (e.keyCode === 13) { $('#login-button').click(); } });

  $('#new-message').on('keydown', function(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      $('#new-message-button').click();
    }
  });

  var $messages = $('#messages');
  var isLoading = false;

  function stopLoading() { isLoading = false; }

  $messages.on('scroll', throttle(function(e) {
    if (isLoading) { return; }

    var scrollTop = $messages.scrollTop();

    if (scrollTop < 30) {
      // (Historic mode) Load more if we're at the top of the message box
      isLoading = true;
      activeChannel.enablePruning();
      activeChannel.getMoreMessages().then(function(messages) {
        if (!messages.length) { return };

        var oldHeight = $('#messages ul').height();
        messages.reverse().forEach(addHistoricalMessage);
        $messages.scrollTop($('#messages ul').height() - oldHeight);
      }).then(stopLoading, stopLoading);
    } else if (scrollTop > $('#messages ul').height() - $messages.height() - 10) {
      // (Live mode) Enable pruning if we hit the bottom of the message box
      if (activeChannel.pruningEnabled) { return; }

      isLoading = true;
      activeChannel.enablePruning();
      activeChannel.prune().then(function(messages) {
        messages.forEach(removeMessage);
      }).then(stopLoading, stopLoading);
    } else {
      // (Historic mode) Disable pruning if the user is scrolling through messages
      activeChannel.disablePruning();
    }
  }, 500));

  $('#new-channel input').on('keydown', function(e) {
    if (e.keyCode === 13) { $('#new-channel-create').click(); }
    else if (e.keyCode === 27) { $('#new-channel-cancel').click(); }
  });
});

function logIn(identity, endpointId) {
  request('/getToken?identity=' + identity + '&endpointId=' + endpointId, function(err, res) {
    if (err) { throw new Error(res.text); }

    var token = res.text;

    $('#login').hide();
    $('#sidebar').show();

    client = new Twilio.IPMessaging.Client(token, {
      maxMessages: 20,
      logLevel: 'debug'
    });

    function addChannel(channel) {
      allChannels.push(channel);

      switch (channel.status) {
        case 'joined':
          addJoinedChannel(channel);
          break;
        case 'invited':
          addInvitedChannel(channel);
          break;
      }
    }

    client.getChannels().then(function (channels) {
      channels
        .filter(function(channel) { return !!channel.friendlyName; })
        .forEach(addChannel);

      client.on('channelAdded', function(channel) {
        allChannels.push(channel);
      });
      client.on('channelJoined', addJoinedChannel);
      client.on('channelInvited', addInvitedChannel);

      client.on('channelRemoved', function(channel) {
        for(var i = 0; i < allChannels.length; i++) {
          if(allChannels[i].sid === channel.sid) {
            allChannels.splice(i, 1);
            break;
          }
        }

        $('#joined-list li[data-sid=' + channel.sid + ']').remove();
      });

      client.on('channelLeft', function(channel) {
        $('#joined-list li[data-sid=' + channel.sid + ']').remove();

        if(channel === activeChannel) {
          clearActiveChannel();
        }
      });
    });
  });

  $('#new-channel-cancel').on('click', function() {
    $('#new-channel').hide();
    $('#channels').show();
  });

  $('#new-channel-button').on('click', function() {
    $('#channels').hide();
    $('#new-channel').show();
    $('#new-channel-name').focus();
  });

  $('#new-channel-create').on('click', function() {
    var attributes = {
      description: $('#new-channel-desc').val()
    };
    var isPrivate = $('#new-channel-is-private').is(':checked');
    var friendlyName = $('#new-channel-name').val();

    client.createChannel({
      attributes: attributes,
      friendlyName: friendlyName,
      isPrivate: isPrivate
    }).then(function joinChannel(channel) {
      $('#new-channel').hide();
      $('#channels').show();
      return channel.join();
    }).then(setActiveChannel);
  });

  $('#channel-search').on('focus keyup', function() {
    var search = $('#channel-search').val();
    var regex = new RegExp(search);

    var $results = allChannels.filter(function(channel) {
      return regex.test(channel.friendlyName);
    }).reduce(function(fragment, channel) {
      var $li = new $('<li/>')
        .text(channel.friendlyName)
        .on('click', channel.join.bind(channel));

      fragment.append($li);
      return fragment;
    }, $(document.createDocumentFragment()));

    $('#search-results').html($results).show();
  });

  $('#channel-search').on('blur', function(e) {
    setTimeout(function() {
      $('#search-results').empty().hide();
    }, 100);
  });
}

function addJoinedChannel(channel) {
  var $leaveButton = $('<button/>').text('X').addClass('leave');
  var $label = $('<label/>').text(channel.friendlyName || channel.sid);

  var $li = $('<li/>')
    .attr('data-sid', channel.sid)
    .append($label)
    .append($leaveButton);

  $('#joined-list').prepend($li);

  $leaveButton.on('click', function(e) {
    e.stopPropagation();
    channel.leave();
  });

  $li.on('click', function enterChannel() {
    setActiveChannel(channel);
  });

  channel.on('updated', function() {
    $label.text(channel.friendlyName);
  });

  return channel;
}

function addInvitedChannel(channel) {
  $('h3.invited').show();

  var $declineButton = $('<button/>').text('X').addClass('decline');
  var $label = $('<label/>').text(channel.friendlyName || channel.sid);

  var $li = $('<li/>')
    .attr('data-sid', channel.sid)
    .append($label)
    .append($declineButton);

  $('#invited-list').prepend($li);

  $declineButton.on('click', function(e) {
    e.stopPropagation();
    channel.decline().then(removeInvitedChannel);
  });

  $li.on('click', function enterChannel() {
    channel.join().then(removeInvitedChannel).then(setActiveChannel);
  });

  channel.on('updated', function() {
    $label.text(channel.friendlyName);
  });

  return channel;
}

function removeInvitedChannel(channel) {
  $('#invited-list li[data-sid="' + channel.sid + '"]').remove();

  if (!$('#invited-list li').length) { 
    $('h3.invited').hide();
  }

  return channel;
}

function clearActiveChannel() {
  $('#messages ul').empty();
  $('#members ul').empty();
  $('#channel').hide();

  if(activeChannel) {
    activeChannel.removeListener('messageAdded', addMessage);
    activeChannel.removeListener('messagePruned', removeMessage);
    activeChannel.removeListener('memberJoined', addMember);
    activeChannel.removeListener('memberLeft', removeMember);
    activeChannel.removeListener('updated', updateActiveChannel);
  }
}

function setActiveChannel(channel) {
  clearActiveChannel();

  $('h1#channel-name').text(channel.friendlyName || 'Unnamed Channel');
  $('h2#channel-desc').text(channel.attributes && channel.attributes.description || '');
  $('#channel').show();

  $('#new-message').focus();

  channel.on('messageAdded', addMessage);
  channel.on('messagePruned', removeMessage);
  channel.on('memberJoined', addMember);
  channel.on('memberLeft', removeMember);
  channel.on('updated', updateActiveChannel);

  channel.getMembers().then(function(members) {
    members.forEach(addMember);
  });

  channel.getMessages().then(function(messages) {
    messages.forEach(addMessage);
    $('#messages').scrollTop($('#messages ul').height());
  });

  $('h1#channel-name').off('click');
  $('h1#channel-name').on('click', function() {
    var $input = $('<input/>').attr('type', 'text').val(activeChannel.friendlyName);
    $('h1#channel-name').empty().append($input);
    $input.focus();

    $input.on('keydown', function(e) {
      if (e.keyCode === 13) {
        var name = $input.val();
        channel.updateFriendlyName(name).then(function() {
          $('h1#channel-name').text(name);
        });
      }
    });

    $input.on('blur', function() {
      $('h1#channel-name').text(activeChannel.friendlyName);
    });
  });

  $('h2#channel-desc').off('click');
  $('h2#channel-desc').on('click', function() {
    var $input = $('<input/>').attr('type', 'text').val(activeChannel.attributes.desc);
    $('h2#channel-desc').empty().append($input);
    $input.focus();

    $input.on('keydown', function(e) {
      if (e.keyCode === 13) {
        var desc = $input.val();
        channel.updateAttributes({ description: desc }).then(function() {
          $('h2#channel-desc').text(desc);
        });
      }
    });

    $input.on('blur', function() {
      $('h2#channel-desc').text(activeChannel.attributes.desc);
    });
  });

  $('#new-message-button').off('click');
  $('#new-message-button').on('click', function() {
    var body = $('textarea#new-message').val();
    channel.sendMessage(body).then(function() {
      $('textarea#new-message').val('');
    });
  });

  $('#add-button').off('click');
  $('#add-button').on('click', function() {
    var identity = $('#invite-name').val();
    channel.add(identity).then(function() {
      $('#invite-name').val('');
    });
  });

  $('#invite-button').off('click');
  $('#invite-button').on('click', function() {
    var identity = $('#invite-name').val();
    channel.invite(identity).then(function() {
      $('#invite-name').val('');
    });
  });

  $('#delete-button').off('click');
  $('#delete-button').on('click', function() {
    channel.delete();
  });

  activeChannel = channel;
}

function addMessage(message) {
  var $messages = $('#messages');
  var $ul = $('#messages ul');
  var $li = $('<li/>').text(message.author + ': ' + message.body).attr('id', message.sid);
  $ul.append($li);
  if ($messages.scrollTop - $ul.height() < 30) {
    $messages.scrollTop( $ul.height() );
  }
}

function addHistoricalMessage(message) {
  var $messages = $('#messages');
  var $ul = $('#messages ul');
  var $li = $('<li/>').text(message.author + ': ' + message.body).attr('id', message.sid);
  $ul.prepend($li);
}

function removeMessage(message) {
  $('#messages ul #' + message.sid).remove();
}

function addMember(member) {
  var $kickButton = $('<button/>').text('X').addClass('kick');
  var $label = $('<label/>').text(member.identity);

  var $li = $('<li/>')
    .attr('data-id', member.identity)
    .append($label)
    .append($kickButton);

  $('#members ul').append($li);

  $kickButton.on('click', function(e) {
    e.stopPropagation();
    member.remove();
  });
}

function removeMember(member) {
  var $member = $('#members li[data-id="' + member.identity + '"]');
  $member.remove();
}

function updateActiveChannel(channel) {
  $('h1#channel-name').text(channel.friendlyName);
  $('h2#channel-desc').text(channel.attributes && channel.attributes.description);
}

function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}
