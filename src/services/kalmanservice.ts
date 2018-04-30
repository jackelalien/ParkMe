import { Injectable } from '@angular/core';

@Injectable()
export class KalmanService {
    public R; //process noise;
    public Q; //measurement noise
    public A; //State Vector
    public B; //Control Vector
    public C; //Measurement Vector
    public cov;
    public x;

    constructor() {

    }

    //Filter a new value
    public filter(z: any, r: number, q: number, a: number, b: number, c: number, u = 0)
    {
        this.R = r;
        this.Q = q;
        this.A = a;
        this.B = b;
        this.C = c;

        if(isNaN(this.x))
        {
            this.x = (1/this.C)*z;
            this.cov = (1/this.C)*this.Q*(1/this.C);
        }
        else
        {
            //Compute Prediction
            const predX = (this.A*this.x)+(this.B * u);
            const predCov = ((this.A*this.cov)*this.A) + this.R;

            //Kalman Gain
            const K = predCov * this.C ** (1 / ((this.C * predCov * this.C) + this.Q));

            //Correction
            this.x = predX + K * (z - (this.C*predX));
            this.cov = predCov - (K * this.C * predCov);

        }

        return this.x;
    }

    //Return last filtered measurmeent
    public lastMeasurement() { return this.x; }

    //Set Measurement Noise Q
    public setMeasurementNoise(noise: any) { this.Q = noise; }

    //Set process noise R
    public setProcessNoise(noise: any) { this.R = noise; }

}