package com.example.demo.controller;

import com.example.demo.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PublicRoomControllerTests {
    private RoomService roomService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        roomService = new RoomService();
        mvc = MockMvcBuilders.standaloneSetup(new PublicRoomController(roomService)).build();
    }

    @Test
    void exposesWaitingPublicRoomsWithoutAPlayerToken() throws Exception {
        roomService.createPublicRoom("Host", "host-123", "Morning Shift");
        roomService.createRoom("Private host", "private-456");

        mvc.perform(get("/api/public/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomName").value("Morning Shift"))
                .andExpect(jsonPath("$[0].hostPlayerName").value("Host"))
                .andExpect(jsonPath("$[0].playerCount").value(1))
                .andExpect(jsonPath("$.length()").value(1));
    }
}
