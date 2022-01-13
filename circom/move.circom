
/*
- It has to be within a Euclidean 
distance of 64 to the origin (0, 0)
- Its Euclidean distance to the origin (0,0) 
has to be more than 32.
💫 GCD(x,y) must be greater than 1 and must not be a prime number.💫
- It cannot be a position where other players 
have spawned within the last 5 minutes
- It cannot be a position currently occupied by another player.

*/
pragma circom 2.0.0;

include "./lib/comparators.circom";
include "./lib/mimcsponge.circom";

template Spawn() {

    signal input x1;
    signal input y1;
    signal input x2;
    signal input y2;

    signal output out_hash_x1_y1;
    signal output out_hash_x2_y2;

    //16 is the number of bits the number has
    //Since X <= 32 and Y <= 32 
    //The max input is 64*64=4096
    //and 16 are enough to represent it

    signal sqMaxDistance;
    signal sqDistance;
    signal diffX;
    signal diffY;
    signal sqDiffX;
    signal sqDiffY;
    component lessThanDist = LessThan(16);
    sqMaxDistance <== 16 * 16;
    //16 is the max distance someone can move
    diffX <== x2 - x1;
    diffY <== y2 - y1;
    sqDiffX <== diffX * diffX;
    sqDiffY <== diffY * diffY;
    sqDistance <== sqDiffX + sqDiffY;
    lessThanDist.in[0] <== sqDistance;
    lessThanDist.in[1] <== sqMaxDistance;
    lessThanDist.out === 1;

    //2 Inputs, 220 rounds, 1 output
    component mimc1 = MiMCSponge(2, 220, 1);
    component mimc2 = MiMCSponge(2, 220, 1);

    mimc1.ins[0] <== x1;
    mimc1.ins[1] <== y1;
    mimc1.k <== 0;
    out_hash_x1_y1 <== mimc1.outs[0];

    mimc2.ins[0] <== x2;
    mimc2.ins[1] <== y2;
    mimc2.k <== 0;
    out_hash_x2_y2 <== mimc2.outs[0];
 }

 component main = Spawn();