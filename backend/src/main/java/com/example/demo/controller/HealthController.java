package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping
    public String healthCheck() {
        // Black background with white text, centered, and a rocket emoji to indicate the backend is running
        // <body> should have 0 margin not 8
        return "<style>body { margin: 0; }</style>" +
                "<div style='background-color: black; color: white; text-align: center; padding: 20px; font-family: Arial, sans-serif; height: 100vh; width: 100vw;'>"
                + "<h1>Robo Rally Backend is up and running! 🚀</h1>"
                + "</div>";
            }
}