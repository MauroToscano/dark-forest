
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

template Spawn() {

    signal input x;
    signal input y;
    signal xSq;
    signal ySq;
    signal rSqMin;
    signal rSqMax;

    //16 is the number of bits the number has
    //Since X <= 32 and Y <= 32 
    //The max input is 64*64=4096
    //and 16 are enough to represent it
    component less64 = LessThan(16);
    component less32 = LessThan(16);

    xSq <== x * x;
    ySq <== y * y;
    rSqMax <== 64 * 64;
    rSqMin <== 32 * 32;
    less64.in[0] <== xSq + ySq;
    less64.in[1] <== rSqMax;
    less64.out === 1;
    less32.in[0] <== xSq + ySq;
    less32.in[1] <== rSqMin;
    less32.out === 0;
 }

 component main = Spawn();