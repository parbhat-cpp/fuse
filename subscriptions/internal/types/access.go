package types

type Usage struct {
	PublicRoomQuota     int `json:"public_room_quota"`
	RoomSchedulingQuota int `json:"room_scheduling_quota"`
}
