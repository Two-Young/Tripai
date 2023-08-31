create table place_detail_caches
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

create table receipt_item_boxes
(
    ribid  varchar(255) not null
        primary key,
    rid    varchar(255) not null,
    text   varchar(255) not null,
    top    int          not null,
    `left` int          not null,
    width  int          not null,
    height int          not null
);

create table session_thumbnail_caches
(
    keyword varchar(255) not null,
    url     varchar(255) not null
);

create table users
(
    uid                   varchar(255)         not null
        primary key,
    id                    varchar(255)         not null,
    user_code             varchar(255)         not null comment 'use as identifier of friend recognition',
    username              varchar(150)         not null,
    profile_image         varchar(255)         null,
    platform              varchar(100)         not null,
    allow_nickname_search tinyint(1) default 1 not null,
    constraint users_pk
        unique (user_code)
);

create table sessions
(
    sid           varchar(255)     not null
        primary key,
    session_code  varchar(255)     not null,
    creator_uid   varchar(255)     not null,
    name          varchar(255)     not null,
    start_at      date             null,
    end_at        date             null,
    created_at    datetime         not null,
    budget        double default 0 null,
    unit          varchar(50)      not null,
    thumbnail_url varchar(255)     null,
    constraint sessions_pk
        unique (session_code),
    constraint sessions_users_uid_fk
        foreign key (creator_uid) references users (uid)
);

create table countries
(
    scid                varchar(255) not null
        primary key,
    country_code        varchar(20)  not null,
    sid                 varchar(255) null,
    airline_reserve_url varchar(255) null,
    constraint countries_sessions_sid_fk
        foreign key (sid) references sessions (sid)
);

create table locations
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
        foreign key (sid) references sessions (sid)
);

create table receipts
(
    rid               varchar(255)    not null
        primary key,
    name              varchar(255)    null,
    original_filename varchar(255)    null,
    filename          varchar(255)    null,
    sid               varchar(255)    null,
    total_price       float default 0 null,
    unit              varchar(20)     null,
    type              varchar(255)    null,
    width             int             not null,
    height            int             not null,
    constraint receipts_sessions_sid_fk
        foreign key (sid) references sessions (sid)
);

create table receipt_items
(
    riid         varchar(255) not null
        primary key,
    rid          varchar(255) null,
    label        varchar(255) not null,
    label_box_id varchar(255) null,
    price        varchar(255) not null,
    price_box_id varchar(255) null,
    constraint receipt_items_receipt_item_boxes_ribid_fk
        foreign key (label_box_id) references receipt_item_boxes (ribid),
    constraint receipt_items_receipt_item_boxes_ribid_fk2
        foreign key (price_box_id) references receipt_item_boxes (ribid),
    constraint receipt_items_receipts_rid_fk
        foreign key (rid) references receipts (rid)
);

create table receipt_items_users
(
    riid   varchar(255) not null,
    uid    varchar(255) not null,
    width  int          null,
    height int          null,
    constraint receipt_items_users_pk
        unique (riid, uid),
    constraint receipt_items_users_receipt_items_riid_fk
        foreign key (riid) references receipt_items (riid),
    constraint receipt_items_users_users_uid_fk
        foreign key (uid) references users (uid)
);

create table schedules
(
    sscid           varchar(255) not null
        primary key,
    name            varchar(255) null,
    photo_reference varchar(255) null,
    place_id        varchar(255) null,
    address         varchar(255) null,
    day             int          null,
    latitude        double       null,
    longitude       double       null,
    start_at        datetime     null,
    memo            longtext     null,
    sid             varchar(50)  null,
    constraint schedules_sessions_sid_fk
        foreign key (sid) references sessions (sid)
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

create table users_friends
(
    uid           varchar(255)         not null,
    requested_uid varchar(255)         not null,
    accepted      tinyint(1) default 0 not null,
    requested_at  datetime             not null,
    confirmed_at  datetime             null comment 'accepted or rejected datetime',
    primary key (uid, requested_uid),
    constraint users_friends_users_uid_fk
        foreign key (uid) references users (uid),
    constraint users_friends_users_uid_fk2
        foreign key (requested_uid) references users (uid)
);

