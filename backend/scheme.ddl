create table travelai.place_detail_caches
(
    place_id        varchar(255) not null
        primary key,
    name            varchar(255) null,
    address         varchar(255) null,
    photo_reference varchar(255) null,
    latitude        double       null,
    longitude       double       null,
    lat_lng         varchar(255) null,
    hit             int          null,
    country_code    varchar(10)  null
);

create table travelai.session_thumbnail_caches
(
    keyword varchar(255) not null,
    url     varchar(255) not null
);

create table travelai.users
(
    uid           varchar(255) not null
        primary key,
    id            varchar(255) not null,
    username      varchar(150) not null,
    profile_image varchar(255) null,
    platform      varchar(100) not null
);

create table travelai.sessions
(
    sid           varchar(255)     not null
        primary key,
    creator_uid   varchar(255)     not null,
    name          varchar(255)     not null,
    start_at      date             null,
    end_at        date             null,
    created_at    datetime         not null,
    budget        double default 0 null,
    unit          varchar(50)      not null,
    thumbnail_url varchar(255)     null,
    constraint sessions_users_uid_fk
        foreign key (creator_uid) references travelai.users (uid)
);

create table travelai.countries
(
    scid                varchar(255) not null
        primary key,
    country_code        varchar(20)  not null,
    sid                 varchar(255) null,
    airline_reserve_url varchar(255) null,
    constraint countries_sessions_sid_fk
        foreign key (sid) references travelai.sessions (sid)
);

create table travelai.locations
(
    lid             varchar(255) not null
        primary key,
    place_id        varchar(255) null,
    name            varchar(255) null,
    latitude        double       null,
    longitude       double       null,
    address         varchar(255) null,
    photo_reference varchar(255) null,
    sid             varchar(50)  null,
    constraint locations_pk
        unique (sid, place_id),
    constraint locations_sessions_sid_fk
        foreign key (sid) references travelai.sessions (sid)
);

create table travelai.receipts
(
    rid         varchar(255)    not null
        primary key,
    name        varchar(255)    null,
    sid         varchar(255)    null,
    total_price float default 0 null,
    unit        varchar(20)     null,
    type        varchar(255)    null,
    constraint receipts_sessions_sid_fk
        foreign key (sid) references travelai.sessions (sid)
);

create table travelai.receipt_items
(
    riid  varchar(255) not null
        primary key,
    rid   varchar(255) null,
    price double       null,
    constraint receipt_items_receipts_rid_fk
        foreign key (rid) references travelai.receipts (rid)
);

create table travelai.receipt_items_users
(
    riid varchar(255) not null,
    uid  varchar(255) not null,
    constraint receipt_items_users_pk
        unique (riid, uid),
    constraint receipt_items_users_receipt_items_riid_fk
        foreign key (riid) references travelai.receipt_items (riid),
    constraint receipt_items_users_users_uid_fk
        foreign key (uid) references travelai.users (uid)
);

create table travelai.schedules
(
    sscid           varchar(255) not null
        primary key,
    name            varchar(255) null,
    photo_reference varchar(255) null,
    place_id        varchar(255) null,
    address         varchar(255) null,
    day             int          null,
    start_at        datetime     null,
    sid             varchar(50)  null,
    constraint schedules_sessions_sid_fk
        foreign key (sid) references travelai.sessions (sid)
);

create table travelai.table_name
(
    sscid     varchar(255) not null
        primary key,
    type      varchar(255) null,
    name      varchar(255) null,
    image_url varchar(255) null,
    place_id  varchar(255) null,
    latitude  double       null,
    longitude double       null,
    address   varchar(255) null,
    start_at  datetime     null,
    end_at    datetime     null,
    scid      varchar(255) null,
    constraint table_name_countries_scid_fk
        foreign key (scid) references travelai.countries (scid)
);

create table travelai.user_sessions
(
    sid varchar(255) not null,
    uid varchar(255) not null,
    constraint user_sessions_pk
        unique (sid, uid),
    constraint user_sessions_sessions_sid_fk
        foreign key (sid) references travelai.sessions (sid),
    constraint user_sessions_users_uid_fk
        foreign key (uid) references travelai.users (uid)
);

