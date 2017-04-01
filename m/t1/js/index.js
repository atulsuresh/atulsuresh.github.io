var getRandomInt = function(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}
var getRandomFloat = function(min, max) {return (Math.random() * (min - max) + max).toFixed(2);}
var postToken = "";
// Centrifugo instance address
var url = "https://damp-wildwood-28280.herokuapp.com/connection";
var channelname = '1';
var apiUrl = "http://139.59.20.140/api/"
// project secret, note that you MUST NEVER reveal project secret key in production
// this is just a pure javascript demo where we generate connection token on client 
// side
var secret = "f239dj29rh3444hhhifif94rrr";

// generate random user ID - in real life scenario this will be your application
// user ID
var user = "102" + getRandomInt(10, 20000);

// current timestamp as string
var timestamp = parseInt(new Date().getTime()/1000).toString();

// generate connection token (must be done on backend in real usage scenario)
var hmacBody = user + timestamp;
var shaObj = new jsSHA("SHA-256", "TEXT");
shaObj.setHMACKey(secret, "TEXT");
shaObj.update(hmacBody);
var token = shaObj.getHMAC("HEX");

var KEY_ENTER=13;

var $input=$(".chat-input"),
    $sendButton=$(".chat-send"),
    $messagesContainer=$(".chat-messages"),
    $messagesList=$(".chat-messages-list"),
    $effectContainer=$(".chat-effect-container"),
    $infoContainer=$(".chat-info-container"),
    messages=0,
    bleeding=100,
    isFriendTyping=false,
    incomingMessages=0,
    lastMessage="";

function addMessage(message,messageType){
    messageType = messageType || 'system';
    var $messageContainer=$("<li/>")
    .addClass('chat-message '+ 'chat-message-'+messageType)
    .appendTo($messagesList)
    ;
    var $messageBubble=$("<div/>")
    .addClass('chat-message-bubble')
    .appendTo($messageContainer)
    ;
    $messageBubble.text(message);
    
    var oldScroll=$messagesContainer.scrollTop();
    $messagesContainer.scrollTop(9999999);
    var newScroll=$messagesContainer.scrollTop();
    var scrollDiff=newScroll-oldScroll;
    TweenMax.fromTo(
        $messagesList,0.4,{
            y:scrollDiff
        },{
            y:0,
            ease:Quint.easeOut
        }
    );
    
    return {
        $container:$messageContainer,
        $bubble:$messageBubble
    };
}

function newMessage(message){    
    if(message=="") return;
    
    lastMessage=message;
    
    var messageElements=addMessage(message,'self')
    ,$messageContainer=messageElements.$container
    ,$messageBubble=messageElements.$bubble
    ;
    
    var oldInputHeight=$(".chat-input-bar").height();
    $input.text('');
    updateChatHeight();
    var newInputHeight=$(".chat-input-bar").height();
    var inputHeightDiff=newInputHeight-oldInputHeight
    
    var $messageEffect=$("<div/>")
    .addClass('chat-message-effect')
    .append($messageBubble.clone())
    .appendTo($effectContainer)
    .css({
        left:$input.position().left-12,
        top:$input.position().top+bleeding+inputHeightDiff
    })
    ;
    
    
    var messagePos=$messageBubble.offset();
    var effectPos=$messageEffect.offset();
    var pos={
        x:messagePos.left-effectPos.left,
        y:messagePos.top-effectPos.top
    }
    
    var $sendIcon=$sendButton.children("i");
    TweenMax.to(
        $sendIcon,0.15,{
            x:30,
            y:-30,
            force3D:true,
            ease:Quad.easeOut,
            onComplete:function(){
                TweenMax.fromTo(
                    $sendIcon,0.15,{
                        x:-30,
                        y:30
                    },
                    {
                        x:0,
                        y:0,
                        force3D:true,
                        ease:Quad.easeOut
                    }
                );
            }
        }
    );
        
    TweenMax.from(
        $messageBubble,0.8,{
            y:-pos.y,
            ease:Sine.easeInOut,
            force3D:true
        }
    );
    
    var startingScroll=$messagesContainer.scrollTop();
    var curScrollDiff=0;
    var effectYTransition;
    var setEffectYTransition=function(dest,dur,ease){
        return TweenMax.to(
            $messageEffect,dur,{
                y:dest,
                ease:ease,
                force3D:true,
                onUpdate:function(){
                    var curScroll=$messagesContainer.scrollTop();
                    var scrollDiff=curScroll-startingScroll;
                    if(scrollDiff>0){
                        curScrollDiff+=scrollDiff;
                        startingScroll=curScroll;
                        
                        var time=effectYTransition.time();
                        effectYTransition.kill();
                        effectYTransition=setEffectYTransition(pos.y-curScrollDiff,0.8-time,Sine.easeOut);
                    }
                }
            }
        );
    }
    
    effectYTransition=setEffectYTransition(pos.y,0.8,Sine.easeInOut);
        
    TweenMax.from(
        $messageBubble,0.6,{
            delay:0.2,
            x:-pos.x,
            ease:Quad.easeInOut,
            force3D:true
        }
    );
    TweenMax.to(
        $messageEffect,0.6,{
            delay:0.2,
            x:pos.x,
            ease:Quad.easeInOut,
            force3D:true
        }
    );
    
    TweenMax.from(
        $messageBubble,0.2,{
            delay:0.65,
            opacity:0,
            ease:Quad.easeInOut,
            onComplete:function(){
                TweenMax.killTweensOf($messageEffect);
                $messageEffect.remove();
            }
        }
    );
    
    messages++;
}

function receiveMessage(message){
    var messageElements=addMessage(message, 'friend')
    ,$messageContainer=messageElements.$container
    ,$messageBubble=messageElements.$bubble
    ;
    
    TweenMax.set($messageBubble,{
        transformOrigin:"60px 50%"
    })
    TweenMax.from($messageBubble,0.4,{
        scale:0,
        force3D:true,
        ease:Back.easeOut
    })
    TweenMax.from($messageBubble,0.4,{
        x:-100,
        force3D:true,
        ease:Quint.easeOut
    })
}

function updateChatHeight(){
    $messagesContainer.css({
        height:460-$(".chat-input-bar").height()
    });
}

$sendButton.click(function(event){
    event.preventDefault();
    sendMessage();
});

$sendButton.on("touchstart",function(event){
    event.preventDefault();
    sendMessage();
});

$input.on("input",function(){
    updateChatHeight();
});

updateChatHeight();

var animateDots = function() {
		var $dots=$("<div/>")
			.addClass('chat-effect-dots')
			.css({
				top:-30+bleeding,
				left:10
			})
			.appendTo($effectContainer)
		;
		for (var i = 0; i < 16; i++) {
			var $dot=$("<div/>")
				.addClass("chat-effect-dot")
				.css({
					left:i*15,
          opacity: getRandomFloat(0.2, 1.0)
				})
				.appendTo($dots)
			;
			TweenMax.to($dot,0.4,{
				delay:getRandomFloat(0.01, 0.2),
				y:getRandomInt(30, 70),
        scale: 0.4,
        opacity: 0,
				yoyo:true,
				ease:Linear.easeInOut,
                onComplete: function(){$dots.remove();}
			})
		};
}

var centrifuge = new Centrifuge({
    // please, read Centrifugo documentation to understand 
    // what does each option mean here
    "url": url,
    "user": user,
    "timestamp": timestamp,
    "token": token,
    "debug": true
});

var subscription;


var postMsgToApi = function(msg) {

}

var postMessage = function() {
    if (centrifuge.isConnected() === false) {
      return;
    }
    var text = $input.text();
    $input.text('');
    if (text.length === 0) {
      return;
    }

    msgdata = {
              isCard: false,
              text: text 
    };


    data = {
      "nick": "anonymous",
      "text": JSON.stringify(msgdata),
      "textname": "hello"
    }


    //subscription.publish(data);http://139.59.20.140/api/company/

    $.ajax({
      url:apiUrl+"trip/"+channelname+"/",
      type:"POST",
      beforeSend: function(xhr){
                
                xhr.setRequestHeader("Authorization","Token "+postToken);
      },
      data: $.param(data),

    }).done(function(data){
        newMessage(text);
    });




    
}

var subscribe = function() {



    var logindata= { username: 'aaa@gmail.com', password: '123456' };



    $.ajax({
      url:apiUrl+"login/",
      type:"POST",
      beforeSend: function(xhr){
                
                xhr.setRequestHeader("Authorization","Token 5f8ac7e04ec205b2cb9440e437561142a2e3a7c3");
      },
      data: $.param(logindata),

    }).done(function(data){
        console.log(data);
        postToken = data.token
    });







    
    subscription = centrifuge.subscribe(channelname, function(message) {
        if (message.data && centrifuge.getClientId() !== message["client"]) {
            receiveMessage(message.data["input"]);
        }
    });

    subscription.on('subscribe', function() {
        addMessage("subscribed on channel "+channelname);
    })
    
    subscription.presence().then(function(message) {
      var count = 0;
      for (var key in message.data){
        count++;
      }
      addMessage('clients connected: ' + count);
    }, function(err) {});
    
    subscription.on('join', function(message) {
        addMessage('user with ID ' + message.data.user + ' joined');
    });

    subscription.on('leave', function(message) {
        addMessage('user with ID ' + message.data.user + ' left');
    });
}

var pingInterval = null;

centrifuge.on('connect', function() {
    addMessage("connected to Centrifugo with user ID " + user);
    subscribe();
    pingInterval = setInterval(function() {
        centrifuge.ping();
    }, 40000);
});

centrifuge.on('disconnect', function(){
    if (pingInterval !== null) {
        clearInterval(pingInterval);
    }
    addMessage('disconnected from Centrifuge');
});

$input.keypress(function(e) {
    if (e.keyCode === KEY_ENTER) {
        e.preventDefault();
        postMessage();
    } else {
        animateDots();
    }
});

centrifuge.connect();