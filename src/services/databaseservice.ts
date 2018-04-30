import { Injectable } from '@angular/core'; 
import { SQLite, SQLiteObject } from "@ionic-native/sqlite";
import { Observable } from 'rxjs/Observable';


@Injectable()
export class DatabaseService {
    public dbName = "Parking_Madisons_House.db";

    private options = { name: this.dbName, location: 'default', createFromLocation: 1};
    public database;
    public takeRisk : Boolean;

    public tables: any[] = [];
    public lots: any[] = [];
    public levels : any[] = [];

    constructor(private sqlite: SQLite)
    {
        
    }

    public OpenDatabase()
    {
        this.options.name = this.dbName;
        this.database = new SQLite();
        this.database.create(this.options).then(() => {
            alert("DB Opened!");
            this.SetLotsAndTables();
        }, (err) => { alert("DB Err: " + err); });

    }

    public SetLotsAndTables()
    {
        var n = this.dbName.substr(0, this.dbName.indexOf('.'));
        //Push into levels as well
        let query = "SELECT * FROM Lots";
        this.sqlite.create(this.options).then((db: SQLiteObject) => {
            db.executeSql(query, {}).then((data) => {
                let rows = data.rows;
                for(let i = 0; i < rows.length; i++)
                {
                    this.lots.push({
                        shapeid: rows.item(i).shapeid,
                        name: rows.item(i).name,
                        lat: rows.item(i).lat,
                        lng: rows.item(i).long
                    });

                    for(let j = 0; j < rows.item(i).levels; j++)
                    {
                        this.tables.push({
                            lot: "Lot " + (j+1),
                            level: j,
                            attr: n + "_LOT_" + i + "" + j + "_Attr",
                            coords: n + "_LOT_" + i + "" + j + "_Coords",
                            points: n + "_LOT_" + i + "" + j + "_Points"
                        });
                    }
                }
                
            })
        }); 
    }

    public getLotCentroids() {
        return this.lots;
    }

    public getLotLevels(lot: any) {
        return this.levels[lot];
    }

    //Lot attributes for search listview
    public getLotsListView() {
        let lotsListView: any[] = [];
        return Observable.create(observer => {
            for(let x in this.tables) {
                let query = "SELECT * FROM " + this.tables[x].attr;

                this.sqlite.create(this.options).then((db: SQLiteObject) => {
                    db.executeSql(query, {}).then((data) => {
                        let rows = data.rows;
                        for(let i = 0; i < rows.length; i++)
                        {
                            if(rows.item(i).type == 'park' && !rows.item(i).IsReserved && !rows.item(i).IsTaken && rows.item(i).AtRisk == this.takeRisk)
                            {
                                var s = "Not at Risk";
                                if(rows.item(i).AtRisk)
                                {
                                    s = "At Risk";
                                }
                                lotsListView.push( {
                                    shapeid: rows.item(i).name,
                                    desc: rows.item(i).desc,
                                    building: this.tables[x].lot,
                                    level: this.tables[x].level,
                                    atRisk: s 
                                }).toString;

                            }
                        }

                        lotsListView.sort((a,b) => {
                            if(a.name < b.name) return -1;
                            if(a.name > b.name) return 1;
                            return 0;
                        });
                    });
                });

            }
            observer.next(lotsListView);
            observer.complete();

        });
    }

    public getCurrentLotTables(lot: any, level: any)
    {
        var n = this.dbName.substr(0, this.dbName.indexOf('.'));
        for(let x in this.tables) {
            if(lot == this.tables[x].lot && level == this.tables[x].level)
            {
                return {attr: this.tables[x].attr, coords: this.tables[x].coords, points: this.tables[x].points}
            }
        }
        return { attr: n + "_LOT_00_Attr",
        coords: n + "_LOT_00_Coords",
        points: n + "_LOT_00_Points"};
    }

    public getLevelTables(lot: any, level: any)
    {
        let tableAttr, tableCoords, tablePoints;
        for(let x in this.tables)
        {
            if(lot == this.tables[x].lot && level == this.tables[x].level)
            {
                tableAttr = this.tables[x].attr;
                tableCoords = this.tables[x].coords;
                tablePoints = this.tables[x].points;
                return {tableAttr, tableCoords, tablePoints};
            }
        }
    }

    public getRoutingPolygonsAttr(data: any)
    {
        let routingPolygons: any[] = [];
        let rows = data.rows;
        for(let i = 0; i < rows.length; i++)
        {
            routingPolygons.push( {
                shapeid: rows.item(i).shapeid,
                name: rows.item(i).name,
                coordinates: "".toString
            });
        }
        return routingPolygons;

    }

    public getRoutingPolygonsCoords(data: any, routingPolygons: any) {
        for (let i = 0; i < routingPolygons.length; i++) {
            let coordinates = [];
            let coordinatesStr = "";
            for (let j = 0; j < data.rows.length; j++) {
                let rows = data.rows;
                if (rows.item(j).shapeid === routingPolygons[i].shapeid) {
                    coordinates.push(rows.item(j).y + ", " + rows.item(j).x + "; ");
                }
            }
            // splice end coordinate (duplicate from start coordinate)
            coordinates.splice(coordinates.length - 1, 1);
            for (let x in coordinates) {
                coordinatesStr += coordinates[x];
            }
            coordinatesStr = coordinatesStr.substring(0, coordinatesStr.length - 2);
            routingPolygons[i].coordinates = coordinatesStr;        
        }
        return routingPolygons;
    }

    //Returns routing polygons and points from building level
    public getRoutingPolygonsPoints(building: String, level: number) {   
        let routingPolygons: any[] = [];
        let routingPoints: any[] = [];

        let tables = this.getLevelTables(building, level);        
        let queryAttr = "SELECT * FROM " + tables[0] + " WHERE routing LIKE '%true%'";
        let queryCoords = "SELECT * FROM " + tables[1];
        let queryPoints = "SELECT * FROM " + tables[2];

        return Observable.create(observer => {
            this.sqlite.create(this.options).then((db: SQLiteObject) => {  
                db.executeSql(queryAttr, {}).then((data) => {  
                    console.log("Get routing polygons attributes.");
                    routingPolygons = this.getRoutingPolygonsAttr(data);                    
                })          
                db.executeSql(queryCoords, []).then((data) => {   
                    console.log("Get routing polygons coordinates.");
                    routingPolygons = this.getRoutingPolygonsCoords(data, routingPolygons);                    
                }) 
                db.executeSql(queryPoints, []).then((data) => {
                    console.log("Get routing points.");
                    routingPoints = this.getRoutingPoints(data);
                    observer.next([routingPolygons, routingPoints]);
                    observer.complete();   
                })                    
            });                  
        })
    } 
    
    //Return Rounting Points from Specific Building Level
    public getRoutingPoints(data: any) {
        let routingPoints: any[] = [];
        for (let i = 0; i < data.rows.length; i++) {
            let rows = data.rows;
            routingPoints.push({lat: parseFloat(rows.item(i).y),
                                lng: parseFloat(rows.item(i).x),
                                type: rows.item(i).type,
                                name: rows.item(i).name,
                                routing: rows.item(i).routing});
        }  
        return routingPoints;                 
    }

    //Return Building Coordinates for Skipped Indoor mapping
    public getAllBuildingsAttrCoords(skip: String) {
        let buildingsSkip: any[] = [];
        let query = "SELECT * FROM buildings WHERE name NOT LIKE '%" + skip + "%'";
        return Observable.create(observer => {
            this.sqlite.create(this.options).then((db: SQLiteObject) => {
                db.executeSql(query, []).then((data) => {
                    for (let i = 0; i < data.rows.length; i++) {
                        let rows = data.rows;
                        buildingsSkip.push({name: rows.item(i).name, coordinates: rows.item(i).coordinates})
                    }
                    observer.next(buildingsSkip);
                    observer.complete();
                });                
            });
        });
    }

    //Return all rooms/attr of level
    public getCurrentAttrCoords(tableAttr: String, tableCoords: String) {
        let rooms: any[] = [];
        console.log("Select room attributes.");
        let queryAttr = "SELECT * FROM " + tableAttr;
        let queryCoords = "SELECT * FROM " + tableCoords;
        let points;

        for (let x in this.tables) {
            if (tableAttr == this.tables[x].attr) {
                points = this.tables[x].points;
                break;
            }
        }        

        return Observable.create(observer => {
            this.sqlite.create(this.options).then((db: SQLiteObject) => {
                db.executeSql(queryAttr, []).then((data) => {
                    for (let i = 0; i < data.rows.length; i++) {
                        let rows = data.rows;
                        rooms.push({shapeid: rows.item(i).shapeid,
                                         name: rows.item(i).name,
                                         type: rows.item(i).type,
                                         desc: rows.item(i).desc,
                                         routing: rows.item(i).routing,
                                         coordinates: "".toString});
                    }                    
                })
                db.executeSql(queryCoords, []).then((data) => {   
                    for (let i = 0; i < rooms.length; i++) {
                        let coordinateArray = [];
                        let coordinatesStr = "";
                        //let index = rooms.map(function(e) { return e.shapeid; }).indexOf(rooms[i].shapeid);
                        for (let j = 0; j < data.rows.length; j++) {
                            let rows = data.rows;
                            if (rows.item(j).shapeid === rooms[i].shapeid) {
                                coordinateArray.push(rows.item(j).y + ", " + rows.item(j).x + "; ");
                                //coordinatesStr += rows.item(j).y + ", " + rows.item(j).x;
                            }
                        }
                        // splice end coordinate (duplicate from start coordinate)
                        coordinateArray.splice(coordinateArray.length - 1, 1);
                        for (let x in coordinateArray) {
                            coordinatesStr += coordinateArray[x];
                        }
                        coordinatesStr = coordinatesStr.substring(0, coordinatesStr.length - 2);
                        rooms[i].coordinates = coordinatesStr;    
                    }     
                    for (let i = 0; i < rooms.length; i++) rooms[i].points = points;
                    observer.next(rooms);                
                    observer.complete();    
                });             
            })
        })
    }

    //Returns all routing points of current building level
    public getCurrentPoints(tablePoints: any) {        
        let points: any[] = [];
        let query = "SELECT * FROM " + tablePoints;
        return Observable.create(observer => {
            this.sqlite.create(this.options).then((db: SQLiteObject) => {
                db.executeSql(query, []).then((data) => {
                    for (let i = 0; i < data.rows.length; i++) {
                        let rows = data.rows;
                        points.push({shapeid: rows.item(i).shapeid,
                                     name: rows.item(i).name,
                                     type: rows.item(i).type,
                                     lat: parseFloat(rows.item(i).y),
                                     lng: parseFloat(rows.item(i).x)});
                    }
                    observer.next(points);
                    observer.complete();
                })                
            })
        })
    }

    //Return Lot Coordinates from Search
    public getRoomCoordinates(shapeid: number, building: String, level: number) {
        let tableCoords;
        for (let x in this.tables) {
            if (building == this.tables[x].building && level == this.tables[x].level) {
                tableCoords = this.tables[x].coords;
                break;
            }
        }

        let queryCoords = "SELECT * FROM " + tableCoords + " WHERE shapeid = " + shapeid;      
        console.log(queryCoords);
        return Observable.create(observer => {     
            this.sqlite.create(this.options).then((db: SQLiteObject) => {
                db.executeSql(queryCoords, []).then((data) => {
                    let coordinates: any[] = []; 
                    for (let i = 0; i < data.rows.length; i++) {
                        coordinates.push({lat: parseFloat(data.rows.item(i).y), lng: parseFloat(data.rows.item(i).x)});                                      
                    } 
                    coordinates.splice(coordinates.length - 1, 1);
                    observer.next(coordinates);                
                    observer.complete();
                })
            })
        })
    }  

    //Return point of destination with coords
    public getRoutePointByName(tablePoints: any, name: any) {
        let queryName = "SELECT * FROM " + tablePoints + " WHERE name LIKE '%" + name + "%'";   
        return Observable.create(observer => {     
            this.sqlite.create(this.options).then((db: SQLiteObject) => {
                db.executeSql(queryName, []).then((data) => {  
                    console.log("Pointname: " + data.rows.item(0).name);
                    let point = {lat: data.rows.item(0).y, lng: data.rows.item(0).x};                     
                    observer.next(point);                
                    observer.complete();
                })
            })
        })
    }
}