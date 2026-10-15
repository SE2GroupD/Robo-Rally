package com.example.demo.service;

import com.example.demo.model.BoardDefinition;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class BoardRegistry {
    private final Map<String, BoardDefinition> boards = new HashMap<>();
    private final ObjectMapper objectMapper;

    public BoardRegistry() {
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void loadBoards() {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        try {
            Resource[] resources = resolver.getResources("classpath:maps/*.json");
            for (Resource resource : resources) {
                BoardDefinition board = objectMapper.readValue(resource.getInputStream(), BoardDefinition.class);
                boards.put(board.id(), board);
                System.out.println("Loaded map: " + board.name() + " (" + board.id() + ")");
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load map definitions", e);
        }
    }

    public BoardDefinition getBoard(String id) {
        return boards.getOrDefault(id, boards.get("classic_start"));
    }

    public BoardDefinition getBoardById(String id) {
        return boards.get(id);
    }
}