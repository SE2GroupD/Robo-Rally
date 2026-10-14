package com.example.demo.controller;

import com.example.demo.config.SecurityConfig;
import com.example.demo.service.MapLayoutService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MapLayoutController.class)
@Import({MapLayoutService.class, SecurityConfig.class})
@ActiveProfiles("test")
class MapLayoutControllerTests {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/maps/default"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/maps"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void returnsRepeatableFrontendCompatibleLayout() throws Exception {
        when(jwtDecoder.decode("preview-token")).thenReturn(Jwt.withTokenValue("preview-token")
                .header("alg", "test")
                .subject("preview-user")
                .build());

        mvc.perform(get("/api/maps").header("Authorization", "Bearer preview-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("extra-crispy"))
                .andExpect(jsonPath("$[0].boards.length()").value(2))
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[2].id").value("burnout"))
                .andExpect(jsonPath("$[2].name").value("Burnout"))
                .andExpect(jsonPath("$[1].id").value("risky-crossing"))
                .andExpect(jsonPath("$[1].name").value("Risky Crossing"))
                .andExpect(jsonPath("$[1].boards[1].tiles[?(@.checkpointNumber == 1)].x").value(5))
                .andExpect(jsonPath("$[1].boards[1].tiles[?(@.checkpointNumber == 2)].y").value(0));

        var first = mvc.perform(get("/api/maps/default").header("Authorization", "Bearer preview-token"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.boards.length()").value(2))
                .andExpect(jsonPath("$.boards[0].id").value("start"))
                .andExpect(jsonPath("$.boards[0].kind").value("start"))
                .andExpect(jsonPath("$.boards[0].x").value(0))
                .andExpect(jsonPath("$.boards[0].y").value(0))
                .andExpect(jsonPath("$.boards[0].rotation").value(0))
                .andExpect(jsonPath("$.boards[0].tiles[0].isSpawnPoint").value(true))
                .andExpect(jsonPath("$.boards[0].tiles[0].conveyor").doesNotExist())
                .andExpect(jsonPath("$.boards[0].tiles[1].x").value(0))
                .andExpect(jsonPath("$.boards[0].tiles[1].y").value(3))
                .andExpect(jsonPath("$.boards[0].tiles[1].isSpawnPoint").value(true))
                .andExpect(jsonPath("$.boards[1].id").value("game-1"))
                .andExpect(jsonPath("$.boards[1].kind").value("game"))
                .andExpect(jsonPath("$.boards[1].x").value(3))
                .andExpect(jsonPath("$.boards[1].y").value(0))
                .andExpect(jsonPath("$.boards[1].rotation").value(0))
                .andExpect(jsonPath("$.id").value("extra-crispy"))
                .andExpect(jsonPath("$.name").value("Extra Crispy"))
                .andExpect(jsonPath("$.boards[1].tiles[?(@.checkpointNumber == 1)].x").value(7))
                .andReturn().getResponse().getContentAsString();

        var second = mvc.perform(get("/api/maps/default").header("Authorization", "Bearer preview-token"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertEquals(first, second);
    }
}
