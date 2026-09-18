package com.example.demo.controller;

import com.example.demo.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RoomControllerTests {
        private MockMvc mvc;
        private RoomService service;
        private final String hostId = "host-123";
        private final String guestId = "guest-456";

        // We will update this mock ID before each request if needed
        private String currentMockSubject;

        @BeforeEach
        void setUp() {
                service = new RoomService();

                // Create a custom resolver to inject JwtMockFactory's output into
                // @AuthenticationPrincipal
                HandlerMethodArgumentResolver principalResolver = new HandlerMethodArgumentResolver() {
                        @Override
                        public boolean supportsParameter(MethodParameter parameter) {
                                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
                        }

                        @Override
                        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                        NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                                // Return a freshly minted Jwt from your factory using the current mock subject
                                return JwtMockFactory.createJwt(currentMockSubject);
                        }
                };

                mvc = MockMvcBuilders.standaloneSetup(new RoomController(service))
                                .setCustomArgumentResolvers(principalResolver)
                                .build();
        }

        @Test
        void roomLifecycleEndpointsReturnUpdatedState() throws Exception {
                var room = service.createRoom("Host", hostId);

                currentMockSubject = hostId; // Set the mock user to the host

                mvc.perform(get("/api/games/" + room.gameId()))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("WAITING"));

                mvc.perform(post("/api/games/" + room.gameId() + "/start"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("STARTED"));

                currentMockSubject = guestId; // Switch the mock user to the guest
                mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON)
                                .content("{\"roomCode\":\"" + room.roomCode() + "\",\"playerName\":\"Guest\"}"))
                                .andExpect(status().isConflict());

                currentMockSubject = hostId; // Switch back to host
                mvc.perform(post("/api/games/" + room.gameId() + "/leave"))
                                .andExpect(status().isNoContent());

                mvc.perform(get("/api/games/" + room.gameId()))
                                .andExpect(status().isNotFound());
        }

        @Test
        void joinsRoomAndReturnsGuestIdentity() throws Exception {
                var room = service.createRoom("Host", hostId);

                currentMockSubject = guestId;
                mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON)
                                .content("{\"roomCode\":\"" + room.roomCode() + "\",\"playerName\":\"Guest\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.gameId").value(room.gameId().toString()))
                                .andExpect(jsonPath("$.roomCode").value(room.roomCode()))
                                .andExpect(jsonPath("$.hostPlayerId").value(room.hostPlayerId()))
                                .andExpect(jsonPath("$.playerId").value(guestId))
                                .andExpect(jsonPath("$.status").value("WAITING"))
                                .andExpect(jsonPath("$.players.length()").value(2))
                                .andExpect(jsonPath("$.players[1].playerName").value("Guest"));
        }

        @Test
        void joinRejectsInvalidRequestsAndMissingRooms() throws Exception {
                currentMockSubject = guestId;
                for (String body : new String[] { "{}", "null", "{broken", "{\"roomCode\":\"ABC234\"}" }) {
                        mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON).content(body))
                                        .andExpect(status().isBadRequest());
                }
                mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON)
                                .content("{\"roomCode\":\"ABC234\",\"playerName\":\"Guest\"}"))
                                .andExpect(status().isNotFound());
        }

        @Test
        void returnsCreatedRoomUsingTheFrontendContract() throws Exception {
                currentMockSubject = hostId;
                mvc.perform(post("/api/games")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"playerName\":\"Guest_1234\"}"))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.gameId").isString())
                                .andExpect(jsonPath("$.roomCode").isString())
                                .andExpect(jsonPath("$.playerId").value(hostId))
                                .andExpect(jsonPath("$.hostPlayerId").value(hostId))
                                .andExpect(jsonPath("$.status").value("WAITING"))
                                .andExpect(jsonPath("$.players.length()").value(1))
                                .andExpect(jsonPath("$.players[0].playerName").value("Guest_1234"));
        }

        @Test
        void rejectsMissingBlankAndMalformedInput() throws Exception {
                currentMockSubject = hostId;
                for (String body : new String[] { "{}", "{\"playerName\":\"   \"}", "null", "{broken" }) {
                        mvc.perform(post("/api/games").contentType(MediaType.APPLICATION_JSON).content(body))
                                        .andExpect(status().isBadRequest());
                }
        }
}