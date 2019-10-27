import { array_remove } from "./util";

/**
 * A class to be extended to allow for the emitting of events. This allows for async communication amongst classes.
 * 
 * Example:
 * ```typescript
 * // Cat is a class that emits an event "meow" occasionally. Person is a class with a `pet` method.
 * // We're going to make it so whenever the cat emits the "meow" event, the person will pet it.
 * let cat = new Cat();
 * let person = new Person();
 * 
 * cat.on("meow", () =>
 * {
 *     person.pet(cat);
 * });
 * 
 * // Events are emitted using [[emitEvent]], usually within the class. So the following code will occur somewhere within the Cat class:
 * this.emitEvent("meow");
 * ```
 */
export class EventClass
{
    /** Map of event names to functions and ids, used internally. */
    private events : Map<string, { fn : Function, id : string }[]> = new Map<string, { fn : Function, id : string }[]>();

    /**
     * This constructor is usually called via `super`, and may provide an easy way to define the events that a class plans to emit. Example:
     * ```typescript
     * class Cat extends EventClass
     * {
     *     constructor()
     *     {
     *         super
     *         ([
     *             "meow",
     *             "purr"
     *         ]);
     *     }
     * }
     * ```
     * @param eventNames An array of event names to initialize the class with. This is the same as calling [[createEvent]] for each of the names.
     */
    constructor(...eventNames : string[])
    {
        eventNames.forEach((eventName) =>
        {
            this.createEvent(eventName);
        });
    }

    /**
     * Creates an entry for a new event. This is used when extending a class that extends EventClass but does not extend the [[constructor]]'s eventNames parameter.
     * ```typescript
     * class AnnoyingCat extends Cat
     * {
     *     constructor()
     *     {
     *         super();
     *         this.createEvent("yowl");
     *     }
     * }
     * ```
     * @param name The name of the event.
     */
    protected createEvent(name : string)
    {
        if (!this.events.has(name))
        {
            this.events.set(name, []);
        }
    }

    /**
     * Emits an event with optional parameters.
     * @param event Name of the event to emit.
     * @param args Additional arguments can be provided that will be passed along to receiving functions. Example:
     * ```typescript
     * // in a CollectorThing class:
     * this.emitEvent("somethingadded", amountAdded); // amountAdded is a number here
     * // in some other class:
     * collectorThing.on("somethingadded", (amountAdded : number) =>
     * {
     *     this.total += amountAdded;
     * });
     * ```
     */
    public emitEvent(event : string, ...args : any[]) : void
    {
        if (!this.events.has(event))
        {
            console.warn("event not yet created: " + event);
            this.events.set(event, []);
        }

        this.events.get(event).forEach(o => o.fn(...args));
    }

    /**
     * Watches for an event, calling a receiving function any time it's emitted.
     * @param event Name of the event to watch for.
     * @param fn Receiving function, will be called whenever the event is emitted.
     * @param id Optional id for use with debugging. Useful if you have a lot of things attached to an event and you want to see what they are at some point.
     */
    public on(event : string, fn : Function, id : string = "[unidentified]")
    {
        if (!this.events.has(event))
        {
            console.warn("event not yet created: " + event);
            this.events.set(event, []);
        }

        this.events.get(event).push({ fn, id });
    }

    /**
     * Similar to [[on]], but registers a receiving function to occur only upon the next emission of the event.
     * @param event Name of the event to watch for.
     * @param fn Receiving function, will be called only one time.
     * @param id Optional id for use with debugging. Useful if you have a lot of things attached to an event and you want to see what they are at some point.
     */
    public once(event : string, fn : Function, id : string = "[unidentified oneshot]")
    {
        if (!this.events.has(event))
        {
            console.warn("event not yet created: " + event);
            this.events.set(event, []);
        }

        let wrapper = 
        {
            fn: (...args : any[]) =>
            {
                fn(...args);
                array_remove(this.events.get(event), wrapper);
            },
            id
        };
        
        this.events.get(event).push(wrapper);
    }

    /**
     * Will print out a list of ids that have registered themselves with an event. These ids correspond to the ones passed in [[on]] and [[once]].
     * @param event The name of the event to debug.
     */
    public debugEvent(event : string)
    {
        if (!this.events.has(event))
        {
            console.warn("event not yet created: " + event);
            this.events.set(event, []);
        }

        console.log("ids registered to event `" + event + "`:");
        this.events.get(event).forEach(o => console.log(o.id));
    }
}

/** A global instance of an EventClass, for when things need to be attached to the global scope instead of a specific class. */
export const GlobalEvents = new EventClass();