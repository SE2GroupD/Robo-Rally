package com.example.demo.game;

import com.example.demo.model.CardType;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ProgrammingDeck {

    private List<CardType> drawPile;
    private List<CardType> discardPile;
    private List<CardType> currentHand;

    public ProgrammingDeck() {
        this.drawPile = new ArrayList<>();
        this.discardPile = new ArrayList<>();
        this.currentHand = new ArrayList<>();
        initializeStandardDeck();
    }

    /**
     * Initializes the standard 20-card starting deck for a player.
     * Note: The exact 20-card distribution varies slightly by edition,
     * but this is a balanced standard loadout.
     */
    private void initializeStandardDeck() {
        addCards(CardType.MOVE_1, 4);
        addCards(CardType.MOVE_2, 3);
        addCards(CardType.MOVE_3, 2);
        addCards(CardType.BACK_UP, 2);
        addCards(CardType.TURN_LEFT, 3);
        addCards(CardType.TURN_RIGHT, 3);
        addCards(CardType.U_TURN, 1);
        addCards(CardType.POWER_UP, 1);
        addCards(CardType.AGAIN, 1);

        Collections.shuffle(this.drawPile);
    }

    private void addCards(CardType type, int count) {
        for (int i = 0; i < count; i++) {
            drawPile.add(type);
        }
    }

    /**
     * Draws a hand of cards (usually 9). If the draw pile empties,
     * the discard pile is shuffled back in to replenish it.
     */
    public List<CardType> drawCards(int amount) {
        currentHand.clear(); // Clear previous hand

        for (int i = 0; i < amount; i++) {
            if (drawPile.isEmpty()) {
                reshuffleDiscardIntoDraw();
            }

            // If it is still empty after reshuffling, the player literally has no cards
            // left
            if (!drawPile.isEmpty()) {
                currentHand.add(drawPile.remove(0));
            }
        }
        return new ArrayList<>(currentHand); // Return a copy of the hand
    }

    /**
     * Called when a player takes damage (e.g., from a laser).
     * The damage card goes directly into their discard pile.
     */
    public void addDamageCard(CardType damageType) {
        discardPile.add(damageType);
    }

    /**
     * After a player locks in their 5 registers, the remaining cards
     * in their hand go to the discard pile.
     */
    public void discardRemainingHand(List<CardType> playedCards) {
        for (CardType card : currentHand) {
            if (!playedCards.contains(card)) {
                discardPile.add(card);
            } else {
                // Remove one instance of the played card from the tracker so we don't discard
                // it
                playedCards.remove(card);
            }
        }
        currentHand.clear();
    }

    /**
     * When the 5 registers finish executing, those cards are discarded.
     */
    public void discardPlayedCards(List<CardType> executedCards) {
        discardPile.addAll(executedCards);
    }

    private void reshuffleDiscardIntoDraw() {
        drawPile.addAll(discardPile);
        discardPile.clear();
        Collections.shuffle(drawPile);
    }

    // Getters
    public List<CardType> getCurrentHand() {
        return currentHand;
    }

    public int getDrawPileSize() {
        return drawPile.size();
    }

    public int getDiscardPileSize() {
        return discardPile.size();
    }
}