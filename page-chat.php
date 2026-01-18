<?php
/* Template Name: Chat */
get_header();

// 🔒 Mora biti logovan korisnik
if (!is_user_logged_in()) {
    echo "<p>⚠️ Morate biti ulogovani da biste koristili chat. <a href='/login'>Login</a></p>";
    get_footer();
    exit;
}

$current_user     = wp_get_current_user();
$current_user_id  = $current_user->ID;
global $wpdb;

// ✅ Dohvati konektovane korisnike
$connected_users = $wpdb->get_results($wpdb->prepare("
    SELECT u.ID, u.display_name, u.user_email
    FROM wp_user_connections c
    JOIN {$wpdb->users} u 
      ON (u.ID = c.user_id OR u.ID = c.connection_id)
    WHERE c.status = 'accepted'
      AND (c.user_id = %d OR c.connection_id = %d)
      AND u.ID != %d
    GROUP BY u.ID
", $current_user_id, $current_user_id, $current_user_id));

// ✅ CSS klasa za mobilni prikaz
$chat_open = (isset($_GET['chat_with']) || isset($_GET['group_id'])) ? 'chat-open' : '';
?>

<div class="chat-container <?php echo esc_attr($chat_open); ?>">
    <!-- Sidebar -->
    <div class="chat-users">
        <h3>📋 Kontakti</h3>
        <ul>
            <?php if ($connected_users): ?>
                <?php foreach ($connected_users as $user): ?>
                    <?php 
                    $status = function_exists('get_user_status') ? get_user_status($user->ID) : 'inactive';
                    $color = $status === 'online' ? 'green' : ($status === 'today' ? 'orange' : 'red');
                    ?>
                    <li>
                        <a href="?chat_with=<?php echo $user->ID; ?>">
                            <?php echo get_avatar($user->ID, 40); ?>
                            <span class="username"><?php echo esc_html($user->display_name); ?></span>
                            <span class="status-dot <?php echo $color; ?>"></span>
                            <span class="unread-count" data-user="<?php echo $user->ID; ?>"></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            <?php else: ?>
                <li><em>Nema konektovanih korisnika</em></li>
            <?php endif; ?>
        </ul>

        <!-- Grupe -->
        <h3>👥 Grupe</h3>
        <ul>
            <?php
            $groups_table  = $wpdb->prefix . 'chat_groups';
            $members_table = $wpdb->prefix . 'chat_group_members';

            $groups = $wpdb->get_results(
                $wpdb->prepare("
                    SELECT g.* 
                    FROM $groups_table g
                    INNER JOIN $members_table m ON g.id = m.group_id
                    WHERE m.user_id = %d
                ", $current_user_id)
            );

            if ($groups) :
                foreach ($groups as $g): ?>
                    <li>
                        <a href="?group_id=<?php echo $g->id; ?>">
                            <?php echo esc_html($g->name); ?>
                            <span class="unread-count-group" data-group="<?php echo $g->id; ?>"></span>
                        </a>
                    </li>
                <?php endforeach;
            else: ?>
                <li><em>Nema grupa</em></li>
            <?php endif; ?>
        </ul>

        <!-- Kreiraj novu grupu -->
        <h3>➕ Nova grupa</h3>
        <form id="create-group-form" method="post">
            <label for="group-name">Naziv grupe:</label>
            <input type="text" id="group-name" name="group_name" required>

            <label>Članovi:</label>
            <select name="members[]" multiple size="5">
                <?php 
                $all_users = $wpdb->get_results($wpdb->prepare("
                    SELECT u.ID, u.display_name
                    FROM wp_user_connections c
                    JOIN {$wpdb->users} u 
                      ON (u.ID = c.user_id OR u.ID = c.connection_id)
                    WHERE c.status = 'accepted'
                      AND (c.user_id = %d OR c.connection_id = %d)
                      AND u.ID != %d
                    GROUP BY u.ID
                ", $current_user_id, $current_user_id, $current_user_id));
                foreach ($all_users as $u): ?>
                    <option value="<?php echo $u->ID; ?>">
                        <?php echo esc_html($u->display_name); ?>
                    </option>
                <?php endforeach; ?>
            </select>

            <button type="submit">Kreiraj grupu</button>
        </form>
        <div id="create-group-result"></div>
    </div>

    <!-- Chat box -->
    <div class="chat-box">
        <button class="back-btn">⬅ Nazad</button>

        <?php if (isset($_GET['chat_with'])): ?>
            <?php
            $other_id = intval($_GET['chat_with']);

            // ✅ provjera da li su povezani
            $check_conn = $wpdb->get_var($wpdb->prepare("
                SELECT id FROM wp_user_connections
                WHERE status = 'accepted'
                  AND ((user_id = %d AND connection_id = %d) OR (user_id = %d AND connection_id = %d))
            ", $current_user_id, $other_id, $other_id, $current_user_id));

            if ($check_conn) {
                $messages = get_messages($current_user_id, $other_id);

                // Označi privatne poruke kao pročitane
                $wpdb->update(
                    $wpdb->prefix . 'messages',
                    array('is_read' => 1),
                    array('receiver_id' => $current_user_id, 'sender_id' => $other_id)
                );

                $other_user = get_userdata($other_id);
                ?>
                <h3>💬 Chat sa: <?php echo esc_html($other_user->display_name); ?></h3>
                <div class="messages">
                    <?php if ($messages): ?>
                        <?php foreach ($messages as $msg): ?>
                            <div class="message <?php echo $msg->sender_id == $current_user_id ? 'sent' : 'received'; ?>" data-id="<?php echo $msg->id; ?>">
                                <?php if (!empty($msg->message)): ?>
                                    <p><?php echo esc_html($msg->message); ?></p>
                                <?php endif; ?>
                                <?php if (!empty($msg->file_url)): ?>
                                    <?php 
                                    $ext = pathinfo($msg->file_url, PATHINFO_EXTENSION);
                                    if (in_array(strtolower($ext), ['jpg','jpeg','png','gif','webp'])): ?>
                                        <p><img src="<?php echo esc_url($msg->file_url); ?>" style="max-width:200px; border-radius:5px;"></p>
                                    <?php else: ?>
                                        <p><a href="<?php echo esc_url($msg->file_url); ?>" target="_blank">📎 Preuzmi fajl</a></p>
                                    <?php endif; ?>
                                <?php endif; ?>
                                <span class="time"><?php echo esc_html($msg->created_at); ?></span>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p>Nema poruka još.</p>
                    <?php endif; ?>
                </div>

                <form id="chat-form" method="post" enctype="multipart/form-data" class="send-message-form">
                    <input type="hidden" name="receiver_id" value="<?php echo $other_id; ?>">
                    <textarea name="message" id="chat-message" placeholder="Upiši poruku..."></textarea>
                    <div class="file-upload-wrapper">
                        <label for="chat-file" class="custom-file-upload">📎 Dodaj fajl</label>
                        <input type="file" name="file" id="chat-file" style="display:none;">
                        <span id="file-name">Nijedan fajl nije izabran</span>
                    </div>
                    <button type="submit">Pošalji</button>
                </form>
            <?php } else { ?>
                <p>⚠️ Niste povezani sa ovim korisnikom.</p>
            <?php } ?>

        <?php elseif (isset($_GET['group_id'])): ?>
            <?php
            $group_id = intval($_GET['group_id']);
            $messages = get_group_messages($group_id);

            if ($messages) {
                foreach ($messages as $msg) {
                    $exists = $wpdb->get_var($wpdb->prepare("
                        SELECT id FROM {$wpdb->prefix}group_reads
                        WHERE message_id = %d AND user_id = %d
                    ", $msg->id, $current_user_id));

                    if (!$exists) {
                        $wpdb->insert(
                            $wpdb->prefix . 'group_reads',
                            array(
                                'message_id' => $msg->id,
                                'user_id'    => $current_user_id,
                                'read_at'    => current_time('mysql')
                            )
                        );
                    }
                }
            }

            $group = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}chat_groups WHERE id=%d", $group_id));

            $members_table = $wpdb->prefix . 'chat_group_members';
            $users_table   = $wpdb->prefix . 'users';
            $members = $wpdb->get_results($wpdb->prepare("
                SELECT u.ID, u.display_name 
                FROM $members_table m
                INNER JOIN $users_table u ON m.user_id = u.ID
                WHERE m.group_id = %d
            ", $group_id));

            $is_admin = ($group->created_by == $current_user_id);
            ?>
            <h3>👥 Grupa: <?php echo esc_html($group->name); ?></h3>

            <div class="group-tabs">
                <button class="tab-btn active" data-target="messages-<?php echo $group_id; ?>">💬 Poruke</button>
                <button class="tab-btn" data-target="members-<?php echo $group_id; ?>">👥 Članovi</button>
            </div>

            <!-- TAB: Poruke -->
            <div id="messages-<?php echo $group_id; ?>" class="tab-content active">
                <div class="messages">
                    <?php if ($messages): ?>
                        <?php foreach ($messages as $msg): ?>
                            <div class="message <?php echo $msg->sender_id == $current_user_id ? 'sent' : 'received'; ?>" data-id="<?php echo $msg->id; ?>">
                                <?php if (!empty($msg->message)): ?>
                                    <p><?php echo esc_html($msg->message); ?></p>
                                <?php endif; ?>
                                <?php if (!empty($msg->file_url)): ?>
                                    <?php 
                                    $ext = pathinfo($msg->file_url, PATHINFO_EXTENSION);
                                    if (in_array(strtolower($ext), ['jpg','jpeg','png','gif','webp'])): ?>
                                        <p><img src="<?php echo esc_url($msg->file_url); ?>" style="max-width:200px; border-radius:5px;"></p>
                                    <?php else: ?>
                                        <p><a href="<?php echo esc_url($msg->file_url); ?>" target="_blank">📎 Preuzmi fajl</a></p>
                                    <?php endif; ?>
                                <?php endif; ?>
                                <span class="time"><?php echo esc_html($msg->created_at); ?></span>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p>Nema poruka još.</p>
                    <?php endif; ?>
                </div>

                <form id="group-chat-form" method="post" enctype="multipart/form-data" class="send-message-form">
                    <input type="hidden" name="group_id" value="<?php echo $group_id; ?>">
                    <textarea name="message" id="group-message" placeholder="Upiši poruku..."></textarea>
                    <div class="file-upload-wrapper">
                        <label for="group-file" class="custom-file-upload">📎 Dodaj fajl</label>
                        <input type="file" name="file" id="group-file" style="display:none;">
                        <span id="group-file-name">Nijedan fajl nije izabran</span>
                    </div>
                    <button type="submit">Pošalji</button>
                </form>
            </div>

            <!-- TAB: Članovi -->
            <div id="members-<?php echo $group_id; ?>" class="tab-content">
                <h4>Članovi grupe:</h4>
                <ul>
                    <?php foreach ($members as $m): ?>
                        <li>
                            <?php echo get_avatar($m->ID, 32); ?>
                            <?php echo esc_html($m->display_name); ?>
                            <?php if ($m->ID == $group->created_by): ?>
                                <strong>(Admin)</strong>
                            <?php endif; ?>

                            <?php if ($is_admin && $m->ID != $group->created_by): ?>
                                <button class="remove-member" data-user="<?php echo $m->ID; ?>" data-group="<?php echo $group_id; ?>">❌ Ukloni</button>
                            <?php endif; ?>
                        </li>
                    <?php endforeach; ?>
                </ul>

                <?php if ($is_admin): ?>
                    <form id="add-member-form">
                        <input type="hidden" name="group_id" value="<?php echo $group_id; ?>">
                        <label>Dodaj člana:</label>
                        <select name="user_id">
                            <?php 
                            $all_users = get_users(array('exclude' => wp_list_pluck($members, 'ID')));
                            foreach ($all_users as $u): ?>
                                <option value="<?php echo $u->ID; ?>">
                                    <?php echo esc_html($u->display_name); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <button type="submit">➕ Dodaj</button>
                    </form>
                <?php endif; ?>

                <?php if ($is_admin): ?>
                    <button class="delete-group" data-group="<?php echo $group_id; ?>" style="margin-top:10px; background:red; color:white; padding:6px 12px; border:none; border-radius:5px; cursor:pointer;">
                        🗑 Obriši grupu
                    </button>
                <?php else: ?>
                    <button class="leave-group" data-group="<?php echo $group_id; ?>" style="margin-top:10px; background:#666; color:white; padding:6px 12px; border:none; border-radius:5px; cursor:pointer;">
                        🚪 Napusti grupu
                    </button>
                <?php endif; ?>
            </div>

        <?php else: ?>
            <p>👈 Izaberi korisnika ili grupu sa liste da započneš chat.</p>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>
