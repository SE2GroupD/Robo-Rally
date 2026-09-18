package com.example.demo.model;


// A conveyor belt tile. isExpress defaults to false (normal, 1-square belt) true means an express belt (2 squares belt)

public record Conveyor(Direction direction, boolean isExpress) {
 
    public Conveyor(Direction direction) {
        this(direction, false);
    }
}
