package com.example.demo.dto;

import com.example.demo.model.CardType;
import java.util.List;

public record ProgramRegisterDto(List<CardType> registers) {
}
