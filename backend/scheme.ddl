create table locations
(
    lid varchar(255) not null
        primary key,
    place_id varchar(255) null,
    name varchar(255) null,
    latitude double null,
    longitude double null,
    address varchar(255) null
);

create table users
(
    uid varchar(255) not null
        primary key,
    id varchar(255) not null,
    username varchar(150) not null,
    profile_image varchar(255) null,
    platform varchar(100) not null
);

create table sessions
(
    sid varchar(255) not null
        primary key,
    creator_uid varchar(255) not null,
    name varchar(255) not null,
    start_at date null,
    end_at date null,
    created_at datetime not null,
    budget float default 0 null,
    unit varchar(50) not null,
    constraint sessions_users_uid_fk
        foreign key (creator_uid) references users (uid)
);

create table countries
(
    scid varchar(255) not null
        primary key,
    country_code varchar(20) not null,
    sid varchar(255) null,
    airline_reserve_url varchar(255) null,
    constraint countries_sessions_sid_fk
        foreign key (sid) references sessions (sid)
);

create table receipts
(
    rid varchar(255) not null
        primary key,
    name varchar(255) null,
    scid varchar(255) null,
    total_price float default 0 null,
    unit varchar(20) null,
    type varchar(255) null,
    constraint receipts_countries_scid_fk
        foreign key (scid) references countries (scid)
);

create table receipt_items
(
    riid varchar(255) not null
        primary key,
    rid varchar(255) null,
    price double null,
    constraint receipt_items_receipts_rid_fk
        foreign key (rid) references receipts (rid)
);

create table receipt_items_users
(
    riid varchar(255) not null,
    uid varchar(255) not null,
    constraint receipt_items_users_pk
        unique (riid, uid),
    constraint receipt_items_users_receipt_items_riid_fk
        foreign key (riid) references receipt_items (riid),
    constraint receipt_items_users_users_uid_fk
        foreign key (uid) references users (uid)
);

create table table_name
(
    sscid varchar(255) not null
        primary key,
    type varchar(255) null,
    name varchar(255) null,
    image_url varchar(255) null,
    place_id varchar(255) null,
    latitude double null,
    longitude double null,
    address varchar(255) null,
    start_at datetime null,
    end_at datetime null,
    scid varchar(255) null,
    constraint table_name_countries_scid_fk
        foreign key (scid) references countries (scid)
);

create table user_sessions
(
    sid varchar(255) not null,
    uid varchar(255) not null,
    constraint user_sessions_pk
        unique (sid, uid),
    constraint user_sessions_sessions_sid_fk
        foreign key (sid) references sessions (sid),
    constraint user_sessions_users_uid_fk
        foreign key (uid) references users (uid)
);

