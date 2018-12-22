/*global require,setInterval,console */
const opcua = require("node-opcua");

// Let's create an instance of OPCUAServer
const server = new opcua.OPCUAServer({
    port: 4336, // the port of the listening socket of the server
    resourcePath: "UA/KServer", // this path will be added to the endpoint resource name
     buildInfo : {
        productName: "KServer",
        buildNumber: "8000",
        buildDate: new Date(2018,12,19)
    }
});

let totalNodes = 0

function AddMeNode(parenter, oName, numVarSets, vUpdaterString, vUpdaterDouble, vUpdaterInt){

    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    // declare a new object
    var KPnt = namespace.addObject({
        organizedBy: parenter,
        browseName: oName
    });

    totalNodes += (numVarSets * 3);
    let i = 0
    for( i = 0; i< numVarSets;i++)
    {
        namespace.addVariable({
            componentOf: KPnt,
            browseName: "VString"+i,
            dataType: "String",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.String, value: vUpdaterString });
                }
            }
        });
        namespace.addVariable({
            componentOf: KPnt,
            browseName: "VDouble"+i,
            dataType: "Double",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Double, value: vUpdaterDouble });
                }
            }
        });
        namespace.addVariable({
            componentOf: KPnt,
            browseName: "VInt"+i,
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: vUpdaterInt });
                }
            }
        });
    }


    return KPnt
}


function AddTree2(parentNode, baseName, numNodes, maxDepth, numVars, treeDepth)
{
    // add some variables 
    // add a variable named MyVariable1 to the newly created folder "MyDevice"
    let vUpdatedString = "Variable String";
    let vUpdatedDouble = 10.1;
    let vUpdatedInt = 5;
    
    treeDepth++;
    if( treeDepth <= maxDepth  )
    {
        let i = 1

        totalNodes += treeDepth;

        for(i = 1; i <= numNodes; i++)
        {
            if(treeDepth == maxDepth)
            {
                iP = AddMeNode(parentNode, baseName + " " + treeDepth +  " " + i, numVars, vUpdatedString, vUpdatedDouble, vUpdatedInt);
            }
            else
            {
                iP = AddMeNode(parentNode, baseName + " " + treeDepth +  " " + i, numVars, vUpdatedString, vUpdatedDouble, vUpdatedInt);
                AddTree2(iP, baseName, numNodes, maxDepth, numVars, treeDepth);
            }
        }

    }  
}


function post_initialize() {
    console.log("initialized");
    function construct_my_address_space(server) {
    
        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        // declare a new object
        const device = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "GNoot"
        });

        const numNodes = 3
        const treeDepth = 3
        const numVars = 1

        

        AddTree2(device, "KNode", numNodes, treeDepth, numVars, 0);


        
        // emulate x changing every 500 ms
        //setInterval(function(){  variable1+=1; }, 500);
        
        namespace.addVariable({
            componentOf: device,
            browseName: "Number of Nodes per Branch",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: numNodes });
                }
            }
        });
        namespace.addVariable({
            componentOf: device,
            browseName: "Number of Depth",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: treeDepth });
                }
            }
        });        
        namespace.addVariable({
            componentOf: device,
            browseName: "Number of Variables",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: numVars });
                }
            }
        });
        namespace.addVariable({
            componentOf: device,
            browseName: "Total Nodes",
            dataType: "Int32",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Int32, value: totalNodes });
                }
            }
        });

        
        /*
        // add a variable named MyVariable2 to the newly created folder "MyDevice"
        let variable2 = 10.0;
        
        namespace.addVariable({         
            componentOf: device,
            nodeId: "ns=1;b=1020FFAA", // some opaque NodeId in namespace 4
            browseName: "MV2",
            dataType: "Double",    
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Double, value: variable2 });
                },
                set: function (variant) {
                    variable2 = parseFloat(variant.value);
                    return opcua.StatusCodes.Good;
                }
            }
        });
        */
        const os = require("os");
        /**
         * returns the percentage of free memory on the running machine
         * @return {double}
         */
        function available_memory() {
            // var value = process.memoryUsage().heapUsed / 1000000;
            const percentageMemUsed = os.freemem() / os.totalmem() * 100.0;
            return percentageMemUsed;
        }
        namespace.addVariable({
            
            componentOf: device,
            
            nodeId: "s=free_memory", // a string nodeID
            browseName: "FreeMemory",
            dataType: "Double",    
            value: {
                get: function () {return new opcua.Variant({dataType: opcua.DataType.Double, value: available_memory() });}
            }
        });
    }
    console.log("KUAServer initializing...");
    construct_my_address_space(server);
    server.start(function() {
        console.log("KUAServer is now listening ... ( press CTRL+C to stop)");
        console.log("port ", server.endpoints[0].port);
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log(" the primary server endpoint url is ", endpointUrl );
    });
}
server.initialize(post_initialize);
