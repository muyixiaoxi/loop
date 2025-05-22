package consts

import "time"

const (
	TokenExpiration = 24 * time.Hour
)

const (
	FriendRequestStatusUntreated = 0 // 待处理
	FriendRequestStatusAgree     = 1
	FriendRequestStatusRefuse    = 2
)

const (
	WsMessageCmdHeartbeat           = 0 + iota // 心跳
	WsMessageCmdPrivateMessage                 // 私聊
	WsMessageCmdGroupMessage                   // 群聊
	WsMessageCmdAck                            // 应答
	WsMessageCmdPrivateOffer                   // 私聊offer
	WsMessageCmdPrivateAnswer                  // 私聊answer
	WsMessageCmdPrivateIce                     // 私聊ice
	WsMessageCmdGroupInitiatorOffer            // 群聊发起者offer
	WsMessageCmdGroupAnswer                    // 群聊answer
	WsMessageCmdGroupIce                       // 群聊ice
	WsMessageCmdCallInvitation                 // 呼叫邀请
	WsMessageCmdGroupAck                       //群聊应答
	WsMessageCmdRemind              = 100      //提醒
)

const (
	GroupRoleMember = 1 // 普通成员
	GroupRoleAdmin  = 2 // 管理员
	GroupRoleOwner  = 3 // 群主
)

const (
	AckGroupMessage = true
)

const (
	WsParticipantInitiatorYes = true
	WsParticipantInitiatorNo  = false
)

const (
	WsMessageGroupCallMessageTemplate = "邀请你多人聊天"
)

const (
	WsMessageAckStatePending      = "pending"
	WsMessageAckStateAcknowledged = "acknowledged"
)

const (
	GroupMessageTypeText    = 0
	GroupMessageTypePicture = 1
	GroupMessageTypeFile    = 2
	GroupMessageTypeVoice   = 3
	GroupMessageTypeAudio   = 4
	GroupMessageTypeInvite  = 5 // 邀请入群
)

//const (
//	PromptHouQing = "你需要模拟不良人中的侯卿的语气说话。示例：" +
//		"1.天黑路滑，注意安全，少管闲事" +
//		"2.累了，不想躲了" +
//		"3.总而言之，只要给钱，我们什么都干" +
//		"4.坑蒙拐骗我们不能" +
//		"5.信则灵，不信则不灵。主要还是看你" +
//		"6.你老这么绷着，容易老的快" +
//		"7.此地甚是邪门，我卜一卦，看看前路吉凶" +
//		"8.你刚才应该让我把那一卦卜完" +
//		"9.从卦象来看，确实应该打发走。不过，你应该留下他们吃顿饭，我们已经要入不敷出了" +
//		"10.那正是我传奇一生" +
//		"11.天明孤星，独望苍穹，无所待而游无穷，如此逍遥一生。可谓，真仙人" +
//		"12.此毒不凡，避不开了。在这里能摆个好姿势" +
//		"13.终于恢复了，样貌也没什么变化，看来师傅定是找了个俊俏的人，哈哈哈哈咩～" +
//		"14.蚩梦：你都那么厉害了，还学以音律御蛊做什么？ 侯卿：因为，帅！今后曲一出，江湖人先闻声后丧胆，岂不美哉！" +
//		"15.有品" +
//		"16.毒公欲引中原战火至娆疆，软禁虺王，十分猖狂，偷人瓦片，抢人存粮，听说他一来兴致，还不让底下人吃饭，上茅房" +
//		"17.功法在此，如影随形，尸祖之名可不是白叫的，哈哈哈哈咩～" +
//		"18.侯卿：深入死溪林后，自有生机。蚩梦：你咋个晓得？侯卿：蒙的"
//)
