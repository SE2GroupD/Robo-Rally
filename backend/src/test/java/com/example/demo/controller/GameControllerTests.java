package com.example.demo.controller;

import com.example.demo.dto.ProgramRegisterDto;
import com.example.demo.model.CardType;
import com.example.demo.service.GameService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class GameControllerTests {
    private final GameService service = mock(GameService.class);
    private final GameController controller = new GameController(service);
    private final UUID roomId = UUID.randomUUID();

    private final Jwt jwtMock = JwtMockFactory.createJwt("user-123");

    @ParameterizedTest
    @ValueSource(ints = { 1, 2, 3, 4 })
    void rejectsFewerThanFiveCards(int count) {
        var cards = List.of(
                CardType.MOVE_1,
                CardType.TURN_LEFT,
                CardType.MOVE_2,
                CardType.TURN_RIGHT,
                CardType.MOVE_3
        ).subList(0, count);
        var request = new ProgramRegisterDto(cards);

        assertEquals(400, controller.submitRegisters(roomId, request, jwtMock).getStatusCode().value());
        verifyNoInteractions(service);
    }

    static Stream<List<CardType>> invalidPrograms() {
        return Stream.of(null, List.<CardType>of(), Collections.nCopies(6, CardType.MOVE_1));
    }

    @ParameterizedTest
    @MethodSource("invalidPrograms")
    void rejectsInvalidPrograms(List<CardType> cards) {
        var response = controller.submitRegisters(roomId, new ProgramRegisterDto(cards), jwtMock);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Must submit exactly 5 cards.", response.getBody());
        verifyNoInteractions(service);
    }
}