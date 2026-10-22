package com.example.demo.controller;

import com.example.demo.service.GameService;
import com.example.demo.service.PublicRoomService;
import com.example.demo.service.PublicRoomServiceImpl;
import com.example.demo.service.RoomService;
import com.example.demo.service.RoomServiceImpl;
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

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RoomControllerTests {
        private MockMvc mvc;
        private RoomService service;
        private GameService gameService;
        private PublicRoomService publicRoomService;
        private final String hostId = "host-123";
        private final String guestId = "guest-456";

        private String currentMockSubject;

        @BeforeEach
        void setUp() {
                service = new RoomServiceImpl();
                publicRoomService = new PublicRoomServiceImpl(service);
                gameService = mock(GameService.class);

                HandlerMethodArgumentResolver principalResolver = new HandlerMethodArgumentResolver() {
                        @Override
                        public boolean supportsParameter(MethodParameter parameter) {
                                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
                        }

                        @Override
                        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                                      NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                                return JwtMockFactory.createJwt(currentMockSubject);
                        }
                };

                mvc = MockMvcBuilders.standaloneSetup(new RoomController(service, publicRoomService, gameService))
                        .setCustomArgumentResolvers(principalResolver)
                        .build();
        }

        @Test
        void rejectsNonIntegerCoordinatesWithoutChangingTheReservation() throws Exception {
                var room = service.createRoom("Host", hostId);
                currentMockSubject = hostId;
                service.selectStart(room.gameId(), hostId, new com.example.demo.model.Position(1, 8), room.mapId());

                for (String position : new String[] {
                        "{\"x\":1.9,\"y\":1}", "{\"x\":1,\"y\":1.9}",
                        "{\"x\":2147483648,\"y\":1}", "{\"y\":3}",
                        "{\"x\":null,\"y\":3}", "{\"x\":\"1\",\"y\":1}", "[]"
                }) {
                        mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"mapId\":\"extra-crispy\",\"position\":" + position + "}"))
                                .andExpect(status().isBadRequest());
                }

                mvc.perform(get("/api/games/" + room.gameId()))
                        .andExpect(jsonPath("$.players[0].startPosition.y").value(8));

                mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"mapId\":\"extra-crispy\",\"position\":null}"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.players[0].startPosition").isEmpty());
        }

        @Test
        void startSelectionEndpointUsesAuthenticatedIdentityAndSerializesCoordinates() throws Exception {
                var room = service.createRoom("Host", hostId);
                service.joinRoom(room.roomCode(), "Guest", guestId);
                currentMockSubject = hostId;

                mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"mapId\":\"extra-crispy\",\"position\":{\"x\":1,\"y\":8},\"playerId\":\"guest-456\"}"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.mapId").value("extra-crispy"))
                        .andExpect(jsonPath("$.players[0].startPosition.y").value(8))
                        .andExpect(jsonPath("$.players[1].startPosition").isEmpty());

                currentMockSubject = guestId;
                mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"mapId\":\"extra-crispy\",\"position\":{\"x\":1,\"y\":8}}"))
                        .andExpect(status().isConflict());
                mvc.perform(post("/api/games/" + room.gameId() + "/map")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"mapId\":\"extra-crispy\"}"))
                        .andExpect(status().isForbidden());
        }

        @Test
        void roomLifecycleEndpointsReturnUpdatedState() throws Exception {
                var room = service.createRoom("Host", hostId);
                service.joinRoom(room.roomCode(), "Guest", guestId);
                service.selectRobot(room.gameId(), hostId, 1);
                service.selectRobot(room.gameId(), guestId, 2);
                service.selectStart(room.gameId(), hostId, new com.example.demo.model.Position(1, 8), room.mapId());
                service.selectStart(room.gameId(), guestId, new com.example.demo.model.Position(1, 1), room.mapId());

                currentMockSubject = hostId;

                mvc.perform(get("/api/games/" + room.gameId()))
                        .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("WAITING"));

                mvc.perform(post("/api/games/" + room.gameId() + "/start"))
                        .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("STARTED"));

                currentMockSubject = guestId;
                mvc.perform(post("/api/games/join").contentType(MediaType.APPLICATION_JSON)
                                .content("{\"roomCode\":\"" + room.roomCode() + "\",\"playerName\":\"Guest\"}"))
                        .andExpect(status().isConflict());

                currentMockSubject = hostId;
                mvc.perform(post("/api/games/" + room.gameId() + "/leave"))
                        .andExpect(status().isNoContent());

                mvc.perform(get("/api/games/" + room.gameId()))
                        .andExpect(status().isNotFound());
        }

        @Test
        void startRoomRejectsWhenLobbyNotReady() throws Exception {
                var room = service.createRoom("Host", hostId);
                currentMockSubject = hostId;

                mvc.perform(post("/api/games/" + room.gameId() + "/start"))
                        .andExpect(status().isConflict());
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

        @Test
        void standaloneStartSelectionRemainsCompatibleAndReportsOccupancy() throws Exception {
                var room = service.createRoom("Host", hostId, "classic_start");
                currentMockSubject = hostId;

                mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"x\":1,\"y\":2}"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.players[0].startPosition.y").value(2))
                        .andExpect(jsonPath("$.startBoardConfig[?(@.y == 2)].occupyingPlayerId").value(hostId));

                mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"x\":1.5,\"y\":2}"))
                        .andExpect(status().isBadRequest());
        }

        @Test
        void catalogRoomsRejectLegacySelectionsWithoutAMapId() throws Exception {
                var room = service.createRoom("Host", hostId);
                currentMockSubject = hostId;

                mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"x\":1,\"y\":1}"))
                        .andExpect(status().isConflict());
        }
    @Test
    void selectStartTileReturnsUpdatedRoom() throws Exception {
        var room = service.createRoom("Host", hostId, "classic_start");
        currentMockSubject = hostId;
        mvc.perform(post("/api/games/" + room.gameId() + "/start-tile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"x\":1,\"y\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.players[0].startPosition.x").value(1))
                .andExpect(jsonPath("$.players[0].startPosition.y").value(1));
    }

    @Test
    void visibilityIsSavedAndIncludedInRoomResponses() throws Exception {
        var room = service.createRoom("Host", hostId);
        currentMockSubject = hostId;
        mvc.perform(get("/api/games/" + room.gameId()))
                .andExpect(jsonPath("$.publicRoom").value(false));
        mvc.perform(put("/api/games/" + room.gameId() + "/visibility")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"publicRoom\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicRoom").value(true))
                .andExpect(jsonPath("$.roomCode").value(room.roomCode()));
        mvc.perform(get("/api/games/" + room.gameId()))
                .andExpect(jsonPath("$.publicRoom").value(true));
        mvc.perform(put("/api/games/" + room.gameId() + "/visibility")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/games/" + room.gameId() + "/visibility")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"publicRoom\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicRoom").value(false));
        mvc.perform(get("/api/games/public")).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void listsAndJoinsPublicRooms() throws Exception {
        currentMockSubject = hostId;
        String publicRoomJson = mvc.perform(post("/api/games/public")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playerName\":\"Host\",\"roomName\":\"Morning Shift\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mapId").value("extra-crispy"))
                .andExpect(jsonPath("$.startBoardConfig.length()").value(6))
                .andReturn().getResponse().getContentAsString();
        String gameId = com.jayway.jsonpath.JsonPath.read(publicRoomJson, "$.gameId");

        mvc.perform(get("/api/games/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].gameId").value(gameId))
                .andExpect(jsonPath("$[0].roomName").value("Morning Shift"))
                .andExpect(jsonPath("$[0].hostPlayerName").value("Host"))
                .andExpect(jsonPath("$[0].playerCount").value(1))
                .andExpect(jsonPath("$[0].maxPlayers").value(6));

        currentMockSubject = guestId;
        mvc.perform(post("/api/games/public/" + gameId + "/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playerName\":\"Guest\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playerId").value(guestId))
                .andExpect(jsonPath("$.mapId").value("extra-crispy"))
                .andExpect(jsonPath("$.players.length()").value(2));
    }

}
