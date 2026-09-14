package com.example.demo.controller;

import com.example.demo.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RoomControllerTests {
    private MockMvc mvc;
    private RoomService service;

    @BeforeEach
    void setUp() {
        // Exercise HTTP/JSON handling without starting PostgreSQL or the whole app.
        service = new RoomService();
        mvc = MockMvcBuilders.standaloneSetup(new RoomController(service)).build();
    }

    @Test
    void joinsRoomAndReturnsGuestIdentity() throws Exception {
        var room = service.createRoom("Host");
        mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roomCode\":\"" + room.roomCode() + "\",\"playerName\":\"Guest\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameId").value(room.gameId().toString()))
                .andExpect(jsonPath("$.roomCode").value(room.roomCode()))
                .andExpect(jsonPath("$.hostPlayerId").value(room.hostPlayerId().toString()))
                .andExpect(jsonPath("$.playerId").value(org.hamcrest.Matchers.not(room.hostPlayerId().toString())))
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.players.length()").value(2))
                .andExpect(jsonPath("$.players[1].playerName").value("Guest"));
    }

    @Test
    void joinRejectsInvalidRequestsAndMissingRooms() throws Exception {
        for (String body : new String[] {"{}", "null", "{broken", "{\"roomCode\":\"ABC234\"}"}) {
            mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roomCode\":\"ABC234\",\"playerName\":\"Guest\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnsCreatedRoomUsingTheFrontendContract() throws Exception {
        mvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playerName\":\"Guest_1234\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.gameId").isString())
                .andExpect(jsonPath("$.roomCode").isString())
                .andExpect(jsonPath("$.playerId").isString())
                .andExpect(jsonPath("$.hostPlayerId").isString())
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.players.length()").value(1))
                .andExpect(jsonPath("$.players[0].playerName").value("Guest_1234"));
    }

    @Test
    void rejectsMissingBlankAndMalformedInput() throws Exception {
        for (String body : new String[] {"{}", "{\"playerName\":\"   \"}", "null", "{broken"}) {
            mvc.perform(post("/api/games").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
    }
}
