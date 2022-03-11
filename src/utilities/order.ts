import { Order } from "@prisma/client";


/**
 * 
 * @param targetOrder 
 * @param candidateOrders 
 * @description finding a set of selling order that sum of counts of that is equal to the buying order count
 * @returns 
 */
// TODO it could be better to use database store procedure
export const orderResolver = (targetOrder: Order, candidateOrders: Order[]) => {

    let finalOrders: Order[] = [];
    let tmpCount = 0;
    for (const order of candidateOrders) {
        tmpCount = order.count;
        finalOrders.push(order);
        for (const innerOrder of candidateOrders) {
            if (order.id === innerOrder.id) {
                continue;
            }

            tmpCount += innerOrder.count;

            if (tmpCount > targetOrder.count) {
                tmpCount -= innerOrder.count;
                continue;
            }

            finalOrders.push(innerOrder);

            if (targetOrder.count === tmpCount) {
                break;
            }
        }
        if (targetOrder.count === tmpCount) {
            break;
        }
        finalOrders = [];
    }

    return finalOrders;
}