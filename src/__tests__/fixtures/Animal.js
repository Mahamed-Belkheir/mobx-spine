import { observable } from 'mobx';
import { Model, Store, BinderApi } from '../..';

export class Location extends Model {
    @observable id = null;
    @observable name = '';
}

export class Breed extends Model {
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            location: Location,
        };
    }
}

export class Person extends Model {
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            town: Location,
        };
    }
}

export class PersonStore extends Store {
    Model = Person;
}

export class Kind extends Model {
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            breed: Breed,
            location: Location,
        };
    }
}

export class Animal extends Model {
    urlRoot = '/api/animal/';
    api = new BinderApi();
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            kind: Kind,
            owner: Person,
            pastOwners: PersonStore,
        };
    }
}

export class AnimalStore extends Store {
    Model = Animal;
    api = new BinderApi();
    url = '/api/animal/';
}

// I have no creativity left after 17h, sorry. Also ssssh.
export class AnimalWithArray extends Model {
    @observable foo = [];
}

export class AnimalWithFrontendProp extends Model {
    @observable id = null;
    @observable _frontend = null;
}

export class AnimalWithoutApi extends Model {
    @observable id = null;
}

export class AnimalStoreWithoutApi extends Store {
    Model = Animal;
}

export class AnimalWithoutUrl extends Model {
    api = new BinderApi();
    @observable id = null;
}

export class AnimalStoreWithoutUrl extends Store {
    api = new BinderApi();
    Model = Animal;
}
